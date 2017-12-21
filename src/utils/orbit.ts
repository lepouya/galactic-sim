import { Vector3 } from 'three';
import force from '../utils/force';
import approximately from './approximately';

const scalar = (s: number, v: Vector3) => v.clone().multiplyScalar(s);
const dot = (v1: Vector3, v2: Vector3) => v1.dot(v2);
const cross = (v1: Vector3, v2: Vector3) => new Vector3().crossVectors(v1, v2);
const up = new Vector3(0, 1, 0);
const tau = 2.0 * Math.PI;

export default class orbit {
  constructor(
    public semiMajorAxis: number,
    public eccentricity: number,
    public inclination: number,
    public longitudeOfAscendingNode: number,
    public argumentOfPeriapsis: number,
    public trueAnomaly: number,
  ) { }

  meanAnomaly: number;
  trueLongitude: number;
  argumentOfLatitude: number;
  periapsis: number;
  apoapsis: number;
  period: number;

  static fromState(primaryMass: number, secondaryMass: number, position: Vector3, velocity: Vector3): orbit {
    const r = position, rl = r.length(); // Orbital position
    const v = velocity, vl = v.length(); // Orbital velocity
    const h = cross(r, v), hl = h.length(); // Orbital momentum
    const n = cross(up, h), nl = n.length(); // Node vector
    const mu = force.G * (primaryMass + secondaryMass); // Gravitational parameter

    const ev = scalar(vl ** 2 - mu / rl, r).sub(scalar(dot(r, v), v)).divideScalar(mu); // Eccentricity vector
    const e = ev.length(); // Eccentricity
    const circular = approximately.zero(e); // Circular orbit

    const E = vl ** 2 / 2 - mu / rl; // Specific orbital energy
    const a = approximately.equal(e, 1) ? Infinity : - mu / (2 * E); // Semi-major axis

    const i = Math.acos(h.y / hl); // Inclination
    const equatorial = approximately.zero(i) || approximately.equal(i, Math.PI); // Equatorial orbit

    let o = equatorial ? 0 : Math.acos(n.x / nl); // Longitude of ascending node
    if (n.z < 0) {
      o = tau - o;
    }

    let w = 0; // Argument of periapsis
    if (!circular && equatorial) {
      w = Math.atan2(ev.z, ev.x);
    } else if (!circular && !equatorial) {
      w = Math.acos(dot(n, ev) / (nl * e));
    }
    if (ev.y < 0) {
      w = tau - w;
    }

    const TL = Math.acos(r.y / rl); // True longitude
    const MA = Math.acos(dot(ev, r) / (e * rl)); // Mean anomaly
    const AOL = Math.acos(dot(n, r) / (nl * rl)); // Argument of latitude
    let nu = (!circular) ? MA : equatorial ? TL : AOL; // True anomaly
    if (dot(r, v) < 0) {
      nu = tau - nu;
    }

    const ret = new orbit(a, e, i, o, w, nu);

    ret.meanAnomaly = MA;
    ret.trueLongitude = TL;
    ret.argumentOfLatitude = AOL;

    const da = a * e;
    ret.periapsis = a - da;
    ret.apoapsis = a + da;
    ret.period = tau * Math.sqrt(a ** 3 / mu);

    return ret;
  }
}
