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
