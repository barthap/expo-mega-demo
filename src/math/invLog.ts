// idea taken from https://stackoverflow.com/questions/39024479/discrete-data-to-logarithmic-scale
// I calculated the inverse of that function given there
// f(x) = b * (log(a+x) - log(a))
// inverse f(x) = a * (10^(x/b) - 1)

// formula for b:
// 1. lastSample / log10(lastSample/a + 1)
// 2. lastSample / (log10(lastSample+a) - log10(a))
// both formulas work for both inverse and non inverse log fn

const getB = (a: number, lastSample: number) =>
  lastSample / Math.log10(lastSample / a + 1);

export const makeLogFn = (a: number, lastSample: number) => {
  const b = getB(a, lastSample);
  const log10a = Math.log10(a);

  return (i: number) => b * (Math.log10(a + i) - log10a);
};

export const makeInvLogFn = (a: number, lastSample: number) => {
  const b = getB(a, lastSample);

  return (i: number) => a * (Math.pow(10, i / b) - 1);
};

/**
 * Generated logarythmic index remap array to be kept in memory
 * to minimalize runtime calculation overhead
 */
export function generateLogIndexArray(a: number, size: number): number[] {
  const invLog = makeLogFn(a, size);
  return new Array(size).fill(undefined).map((_, i) => {
    return Math.round(invLog(i));
  });
}
