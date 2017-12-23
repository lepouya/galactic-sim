import { Vector3 } from 'three';
import force from '../utils/force';
import approximately from './approximately';

export type OrbitalExtras = {
  trueAnomaly: number;
  eccentricAnomaly: number;
  trueLongitude: number;
  periapsis: number;
  apoapsis: number;
  period: number;
}

/**
 * Representation of an orbit using Kepler elements
 */
export default class orbit {
  constructor(
    public semiMajorAxis: number,
    public eccentricity: number,
    public inclination: number,
    public longitudeOfAscendingNode: number,
    public argumentOfPeriapsis: number,
    public meanAnomaly: number,
  ) { }

  public extras: OrbitalExtras;

  /**
   * Convert Cartesian orbital state to Kepler elements
   * @param primaryMass   Mass of the central body
   * @param secondaryMass Mass of the orbiting body
   * @param position      Position vector of orbiting body relative to central body
   * @param velocity      Velocity vector of orbiting body relative to central body
   * @returns             Keplerian orbital elements
   */
  static fromCartesian(primaryMass: number, secondaryMass: number, position: Vector3, velocity: Vector3): orbit {
    const r = position, rl = r.length(); // Orbital position
    const v = velocity, vl = v.length(); // Orbital velocity
    const h = new Vector3().crossVectors(r, v), hl = h.length(); // Orbital momentum
    const mu = force.G * (primaryMass + secondaryMass); // Gravitational parameter

    const a = 1 / (2 / rl - vl ** 2 / mu); //  Semi-major axis

    const p = hl ** 2 / mu;
    const q = r.dot(v);
    const e = Math.sqrt(1 - p / a);  // eccentricity

    const i = Math.acos(h.y / hl); // Inclination
    const equatorial = approximately.zero(i) || approximately.equal(i, Math.PI); // Equatorial orbit
    const o = equatorial ? 0 : Math.atan2(h.x, -h.z); // Longitude of ascending node

    const nu = Math.atan2(hl * q / (rl * mu), hl ** 2 / (rl * mu) - 1); // True anomaly
    const u = Math.atan2(q / Math.sqrt(a * mu), 1 - rl / a); // Eccentric anomaly
    const m = u - e * Math.sin(u); // Mean anomaly

    const cs = (rl * Math.cos(o) + r.z * Math.sin(o)) / rl;
    let sw = 0;
    if (equatorial) {
      sw = (r.z * Math.cos(o) - r.x * Math.sin(o)) / rl;
    } else {
      sw = r.y / (rl * Math.sin(i));
    }
    let w = Math.atan2(sw, cs) - nu; // Argument of periapsis
    if (w < 0) {
      w += 2 * Math.PI;
    }

    const ret = new orbit(a, e, i, o, w, m);
    ret.extras = {
      trueAnomaly: nu,
      eccentricAnomaly: u,
      trueLongitude: (w + nu + o) % (2 * Math.PI),
      periapsis: a * (1 - e),
      apoapsis: a * (1 + e),
      period: 2 * Math.PI * Math.sqrt(a ** 3 / mu),
    };

    return ret;
  }

  /**
   * Convert Kepler elements to Cartesian orbital state
   * @param primaryMass   Mass of the central body
   * @param secondaryMass Mass of the orbiting body
   * @returns             Position and velocity vectors of the orbiting body with respect to the central body
   */
  toCartesian(primaryMass: number, secondaryMass: number): [Vector3, Vector3] {
    const mu = force.G * (primaryMass + secondaryMass); // Gravitational parameter

    // Shortcuts for Kepler elements
    const a = this.semiMajorAxis, e = this.eccentricity, i = this.inclination;
    const o = this.longitudeOfAscendingNode, w = this.argumentOfPeriapsis, m = this.meanAnomaly;
    const cw = Math.cos(w), sw = Math.sin(w);
    const co = Math.cos(o), so = Math.sin(o);
    const ci = Math.cos(i), si = Math.sin(i);

    // Calculate eccentric anomaly using Newton's method
    let j = 0, u = m;
    let f = u - e * Math.sin(u) - m;
    while (Math.abs(f) > 1e-6 && j < 30) {
      u = u - f / (1 - e * Math.cos(u));
      f = u - e * Math.sin(u) - m;
      j++;
    }

    const nu = 2 * Math.atan2(Math.sqrt(1 + e) * // True anomaly
      Math.sin(u / 2), Math.sqrt(1 - e) * Math.cos(u / 2));

    const rl = a * (1 - e * Math.cos(u)); // Distance to central body
    const r = new Vector3(rl * Math.cos(nu), 0, rl * Math.sin(nu)); // Position in orbital frame
    const v = new Vector3(-Math.sin(u), 0, Math.sqrt(1 - e ** 2) * Math.cos(u))
      .multiplyScalar(Math.sqrt(mu * a) / rl); // Velocity vector in the orbital frame

    return [
      new Vector3(
        r.x * (cw * co - sw * ci * so) - r.z * (sw * co + cw * ci * so),
        r.x * (sw * si) + r.z * (cw * si),
        r.x * (cw * so + sw * ci * co) + r.z * (cw * ci * co - sw * so),
      ),
      new Vector3(
        v.x * (cw * co - sw * ci * so) - v.z * (sw * co + cw * ci * so),
        v.x * (sw * si) + v.z * (cw * si),
        v.x * (cw * so + sw * ci * co) + v.z * (cw * ci * co - sw * so),
      ),
    ];
  }
}
