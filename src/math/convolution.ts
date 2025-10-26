import { Complex } from "./fft";
import { generateLogIndexArray } from "./invLog";

/**
 * Makes quadratic convolution window for given center and width
 * @param x0 Convolution window center
 * @param halfWidth Distance from center to window border
 * @returns window function `(x) => number` to use in `conv()`
 */
export const makeQuadratic = (x0: number, halfWidth: number) => (x: number) =>
  Math.max(0, (-1 / (halfWidth * halfWidth)) * Math.pow(x - x0, 2) + 1);

/**
 * Makes exponent convolution window for given center and width
 * @param x0 Convolution window center
 * @param halfWidth Distance from center to ?-th quantile (equivalent of quadratic root)
 * @returns window function `(x) => number` to use in `conv()`
 */
export const makeExponent = (x0: number, halfWidth: number) => (x: number) =>
  Math.exp((-1 / (halfWidth * halfWidth)) * Math.pow(x - x0, 2));

/**
 * Calculates convolution for given array of samples and window function
 * $$\sum_{i=0}^N{samples_i*windowFun(i)}$$
 * @param samples arrray of FFT samples
 * @param windowFun window function
 * @param sliceAt take first `N` samples only (ignore rest)
 * @returns a number being a convolution result
 */
export const conv = (
  samples: number[],
  windowFun: (x: number) => number,
  sliceAt: number = samples.length
) =>
  samples
    .slice(0, sliceAt)
    .reduce((acc, sample, i) => acc + sample * windowFun(i), 0);

/**
 * Bin number to bin frequency converter factory
 * @param binWidth
 * @returns function `binNumber => binFrequency`
 */
export const ithBinToFreq = (binWidth: number) => (i: number) =>
  i * (binWidth / 2);

/**
 * Frequency to bin number converter factory
 * @param binWidth
 * @returns function `frequency => binNumber`
 */
export const freqToBinNumber = (binWidth: number) => (freq: number) =>
  Math.round(freq / binWidth);

/**
 * Calculates bin width for given sampling rate and FFT size
 * @param samplingRate
 * @param fftSize
 * @returns
 */
export const getBinWidth = (samplingRate: number, fftSize: number) =>
  samplingRate / fftSize;

/**
 * Calculates optimal convolution window width for given num of bins
 * basing on number of samples
 * @example
 * ```ts
 * const convWidth = convWidth(8, 512); // returns 64
 * ```
 */
export const convWidthForNumBins = (numBins: number, numSamples: number) =>
  Math.floor(numSamples / numBins);

// Helpers

export function exponentBinsForSamples(
  fftSamples: number[],
  numBins: number,
  sliceAt = fftSamples.length
): number[] {
  const convWidth = convWidthForNumBins(numBins, sliceAt);
  const halfWidth = Math.floor(convWidth / 2);
  const results: number[] = Array(numBins);

  for (let i = 0; i < numBins; i++) {
    // step = convWidth
    const windowFun = makeExponent((i + 1) * convWidth, halfWidth);
    results[i] = conv(fftSamples, windowFun, sliceAt);
  }

  return results;
}

export function normalizeUsingSum(bins: number[]): number[] {
  const sum = bins.reduce((a, b) => a + b, 0);
  return bins.map((bin) => bin / sum);
}

const aWeightFrequency = [ 
  10, 12.5, 16, 20, 
  25, 31.5, 40, 50, 
  63, 80, 100, 125, 
  160, 200, 250, 315, 
  400, 500, 630, 800, 
  1000, 1250, 1600, 2000, 
  2500, 3150, 4000, 5000,
  6300, 8000, 10000, 12500, 
  16000, 20000 
];

const aWeightDecibels = [
  -70.4, -63.4, -56.7, -50.5, 
  -44.7, -39.4, -34.6, -30.2, 
  -26.2, -22.5, -19.1, -16.1, 
  -13.4, -10.9, -8.6, -6.6, 
  -4.8, -3.2, -1.9, -0.8, 
  0.0, 0.6, 1.0, 1.2, 
  1.3, 1.2, 1.0, 0.5, 
  -0.1, -1.1, -2.5, -4.3, 
  -6.6, -9.3 
];
function calculateAWeightingDBForFFTAverages(fftSize: number) {
  const result = new Array(fftSize / 2).fill(0);

  const fftBandWidth = 44100 / 2048;
  for (let i = 0; i < result.length; i++) {
    const binCenterFreq = (i + 1) * fftBandWidth / 2;
    result[i] = calculateAWeightingDBAtFrequency(binCenterFreq);
  }
  return result;    
}

function calculateAWeightingDBAtFrequency(frequency: number) {
  return linterp(aWeightFrequency, aWeightDecibels, frequency);    
}
function linterp(x: number[], y: number[], xx: number) {
  // assert(x.length > 1);
  // assert(x.length == y.length);

  let result = 0.0;
  let found = false;

  if (x[0] > xx) {
    result = y[0];
    found = true;
  }

  if (!found) {
    for (let i = 1; i < x.length; i++) {
      if (x[i] > xx) {
        result = y[i-1] + ((xx - x[i-1]) / (x[i] - x[i-1])) * (y[i] - y[i-1]);
        found = true;
        break;
      }
    }
  }

  if (!found) {
    result = y[y.length-1];
  }

  return result;     
}

export function binCalculatorFactory(numBins: number, fftSliceSize: number) {
  const d = Math.log10(fftSliceSize-1)/numBins;
  
  const aWeightDBAtBandCentreFreqs = calculateAWeightingDBForFFTAverages(2048);
  
  return (fftSamples: Complex[]) => {
    const results = new Array<number>(numBins).fill(0);

    let startIdx = 1;
    for (let binIdx = 0; binIdx < numBins; binIdx++) {
      const endIdx = Math.round(Math.pow(10,(binIdx+1)*d))
      
      for (let j = startIdx; j <= endIdx; j++) {
        let [re, im] = fftSamples[j].components();
        const power = re * re + im * im
        const bandsPerBin = endIdx - startIdx + 1;
        const powerDb = 10 * Math.log10(power) + aWeightDBAtBandCentreFreqs[j + bandsPerBin] * 0.4;
        results[binIdx] = Math.max(results[binIdx], powerDb);
      }
      
      startIdx = endIdx+1;
    }
    return results;
  };
}

/**
 * A higher-order function. Returns a function which converts fft samples
 * into `numBins` frequency bins, using logarythmic scale
 *
 * It opts-out of functional calculations, because of performance reasons
 * It has to be fast, it is called very frequently
 */
export function makeOptimalQuadraticBinsForSamples(
  numBins: number,
  sliceAt: number,
  logIdxRemapCoeff: number = 20
) {
  const convWidth = sliceAt / numBins;
  const halfWidth = convWidth / 2;
  const indexRemap = generateLogIndexArray(logIdxRemapCoeff, sliceAt);

  return (fftSamples: number[]) => {
    const results = new Array<number>(numBins).fill(0);
    const [,maxIndex] = fftSamples.slice(0, 1024).reduce(([prev_val, prev_i], val, i) => val > prev_val ? [val, i] : [prev_val, prev_i], [0, 0]);
    console.log(maxIndex, indexRemap[maxIndex]);

    for (let binIdx = 0; binIdx < numBins; binIdx++) {
      // step = convWidth
      const x0 = (binIdx + 1) * convWidth;

      // calc discrete convolution:
      // \sum_{k=j_{idx}}^{sliceAt}max\left[\frac{-1}{halfWidth^2}(k-x_0)^2+1;\ 0 \right ]
      for (let j = 0; j < sliceAt; j++) {
        let k = indexRemap[j];
        results[binIdx] +=
          fftSamples[k] *
          Math.max(0, (-1 / (halfWidth * halfWidth)) * (k - x0) * (k - x0) + 1);
      }
    }
    return results;
  };
}
