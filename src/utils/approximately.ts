export default class approximately {
  static threshold = 1.0e-3;

  static zero = (a: number) => Math.abs(a) < approximately.threshold;

  static is = (a: number, b: number) => Math.abs(a - b) < approximately.threshold;
  static isNot = (a: number, b: number) => Math.abs(a - b) >= approximately.threshold;
}