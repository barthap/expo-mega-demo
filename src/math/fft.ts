export class Complex {
  re: number;
  im: number;
  constructor(re: number, im: number = 0) {
    this.re = re;
    this.im = im;
  }

  add(other: Complex, dst: Complex): Complex {
    dst.re = this.re + other.re;
    dst.im = this.im + other.im;
    return dst;
  }

  sub(other: Complex, dst: Complex) {
    dst.re = this.re - other.re;
    dst.im = this.im - other.im;
    return dst;
  }
  mul(other: Complex, dst: Complex) {
    //cache re in case dst === this
    const r = this.re * other.re - this.im * other.im;
    dst.im = this.re * other.im + this.im * other.re;
    dst.re = r;
    return dst;
  }
  cexp(dst: Complex) {
    const er = Math.exp(this.re);
    dst.re = er * Math.cos(this.im);
    dst.im = er * Math.sin(this.im);
    return dst;
  }
  /**
   * @returns Magnitude of the complex number
   */
  mag() {
    return Math.sqrt(this.re * this.re + this.im * this.im);
  }

  print() {
    /*
	although 'It's just a matter of separating out the real and imaginary parts of jw.' is not a helpful quote
	the actual formula I found here and the rest was just fiddling / testing and comparing with correct results.
	http://cboard.cprogramming.com/c-programming/89116-how-implement-complex-exponential-functions-c.html#post637921
	*/
    if (!this.re) console.log(this.im.toString() + "j");
    else if (this.im < 0)
      console.log(this.re.toString() + this.im.toString() + "j");
    else console.log(this.re.toString() + "+" + this.im.toString() + "j");
  }
}

export function cfft(amplitudes: number[]): Complex[] {
  const N = amplitudes.length;
  // @ts-ignore
  if (N <= 1) return amplitudes;

  const hN = N / 2;
  let even: (Complex | number)[] = Array(hN);
  let odd: (Complex | number)[] = Array(hN);

  for (let i = 0; i < hN; ++i) {
    even[i] = amplitudes[i * 2];
    odd[i] = amplitudes[i * 2 + 1];
  }
  even = cfft(even as number[]);
  odd = cfft(odd as number[]);

  const a = -2 * Math.PI;
  for (let k = 0; k < hN; ++k) {
    if (!(even[k] instanceof Complex))
      even[k] = new Complex(even[k] as number, 0);
    if (!(odd[k] instanceof Complex)) odd[k] = new Complex(odd[k] as number, 0);
    const p = k / N;
    const t = new Complex(0, a * p);
    t.cexp(t).mul(odd[k] as Complex, t);
    // @ts-ignore
    amplitudes[k] = even[k].add(t, odd[k]);
    //@ts-ignore
    amplitudes[k + hN] = even[k].sub(t, even[k]);
  }
  //@ts-ignore
  return amplitudes;
}
