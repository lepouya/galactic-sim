export default class approximately {
  static threshold = 1.0e-3;

  static zero = (a: number) => Math.abs(a) < approximately.threshold;

  static equal = (a: number, b: number) => Math.abs(a - b) < approximately.threshold;
  static notEqual = (a: number, b: number) => Math.abs(a - b) >= approximately.threshold;
}