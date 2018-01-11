import { Vector3 } from 'three';
import approximately from './approximately';

export default class unit {
  static readonly printPrecision = 3;

  static readonly absolute = ''; // No units
  static readonly distance = 'm';
  static readonly time = 's';
  static readonly mass = 'Kg'
  static readonly angle = '°';
  static readonly date = '// ::';
  static readonly speed = 'm/s';
  static readonly acceleration = 'm/s^2';
  static readonly force = 'Kg.m/s^2';

  static readonly G = 6.67408e-11; // m^3/Kg/s^2
  static readonly c = 299792458; // m/s

  static readonly minute = 60;
  static readonly hour = 60 * unit.minute;
  static readonly day = 24 * unit.hour;
  static readonly year_tropical = 365 * unit.day;
  static readonly year_Julian = 365.25 * unit.day;
  static readonly year_Gregorian = 365.2425 * unit.day;

  static readonly milli = 1e-3;
  static readonly kilo = 1e+3;
  static readonly mega = 1e+6;
  static readonly giga = 1e+9;
  static readonly tera = 1e+12;

  static readonly ly = unit.c * unit.year_Julian;

  private static distances = new Map([
    [unit.ly, 'ly'],
    [unit.c * unit.day, 'ld'],
    [unit.c, 'ls'],
    [unit.mega, 'Mm'],
    [unit.kilo, 'Km'],
    [1, 'm'],
    [unit.milli, 'mm'],
    [0, 'm'],
  ]);

  private static times = new Map([
    [unit.year_tropical, 'yr'],
    [unit.day, 'day'],
    [unit.hour, 'hr'],
    [unit.minute, 'min'],
    [1, 's'],
    [unit.milli, 'ms'],
    [0, 's'],
  ]);

  private static masses = new Map([
    [unit.tera, 'Gt'],
    [unit.giga, 'Mt'],
    [unit.mega, 'Kt'],
    [unit.kilo, 't'],
    [1, 'Kg'],
    [unit.milli, 'g'],
    [0, 'Kg'],
  ]);

  private static findMax(n: number, m: Map<number, string>) {
    n = Math.abs(n);
    let res = 0;
    m.forEach((_, v) => res = Math.max(res, (n >= v) ? v : res));
    return res;
  }

  static nPrint(n: number) {
    return n.toPrecision(unit.printPrecision);
  }

  static mPrint(n: number, m: Map<number, string>) {
    const c = unit.findMax(n, m);
    return unit.nPrint(n / c) + m.get(c);
  }

  static aPrint(a: number) {
    let res = (a < 0) ? '-' : '';
    const deg = Math.abs(a / Math.PI * 180);

    const d = Math.floor(deg);
    if (d > 0) {
      res += d.toFixed() + '°';
    }

    const m = Math.floor((deg - d) * 60);
    if (m > 0) {
      if (d > 0) {
        res += ' ';
      }
      res += m.toFixed() + "'";
    }

    const s = Math.floor(((deg - d) * 60 - m) * 60);
    if (s > 0) {
      if (d + m > 0) {
        res += ' ';
      }
      res += s.toFixed() + '"';
    }

    return res;
  }

  private static pDate(n: number, offset = 0, digits = 2) {
    let ret = (n + offset).toFixed();
    while (ret.length < digits) {
      ret = '0' + ret;
    }
    return ret;
  }

  static dPrint(n: number) {
    const y = Math.floor(n / unit.year_tropical);
    n -= y * unit.year_tropical;
    const d = Math.floor(n / unit.day);
    n -= d * unit.day;
    const h = Math.floor(n / unit.hour);
    n -= h * unit.hour;
    const m = Math.floor(n / unit.minute);
    n -= m * unit.minute;

    return (
      unit.pDate(y, 1, 1) + '/' + unit.pDate(d, 1, 1) + ' ' +
      unit.pDate(h) + ':' + unit.pDate(m) + ':' + unit.pDate(n)
    );
  }

  static uPrint(n: number, u: string) {
    if (approximately.zero(n)) {
      return '0' + u;
    }

    switch (u) {
      case unit.distance:
        return unit.mPrint(n, unit.distances);
      case unit.time:
        return unit.mPrint(n, unit.times);
      case unit.mass:
        return unit.mPrint(n, unit.masses);
      case unit.speed:
        return unit.mPrint(n, unit.distances) + '/s';
      case unit.acceleration:
        return unit.mPrint(n, unit.distances) + '/s^2';
      case unit.angle:
        return unit.aPrint(n);
      case unit.date:
        return unit.dPrint(n);
      default:
        return unit.nPrint(n) + u;
    }
  }

  static vPrint(v: Vector3, u: string) {
    return `[${unit.uPrint(v.x, u)}, ${unit.uPrint(v.y, u)}, ${unit.uPrint(v.z, u)}]`;
  }

  static print(v: number | Vector3, u = unit.absolute): string {
    if (typeof v === 'number') {
      return unit.uPrint(v, u);
    } else if (v instanceof Vector3) {
      return unit.vPrint(v, u);
    } else {
      return "";
    }
  }
}