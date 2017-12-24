import { Vector3 } from 'three';
import Force from '../utils/Force';
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
export default class Orbit {
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
  static fromCartesian(primaryMass: number, secondaryMass: number, position: Vector3, velocity: Vector3): Orbit {
    const r = new Vector3(position.x, position.z, position.y), rl = r.length(); // Orbital position
    const v = new Vector3(velocity.x, velocity.z, velocity.y), vl = v.length(); // Orbital velocity
    const h = new Vector3().crossVectors(r, v), hl = h.length(); // Orbital momentum
    const n = new Vector3(0, 0, 1).cross(h), nl = n.length(); // Ascending vector
    const mu = Force.G * (primaryMass + secondaryMass); // Gravitational parameter

    const a = 1 / (2 / rl - vl ** 2 / mu); //  Semi-major axis

    const ev = v.clone().divideScalar(mu).cross(h).sub(r.clone().normalize()); // Eccentricity vector
    const e = ev.length(); // Eccentricity

    const i = Math.acos(h.z / hl); // Inclination
    const equatorial = approximately.zero(i) || approximately.equal(i, Math.PI); // Equatorial orbit

    var o = equatorial ? 0 : Math.acos(n.x / nl); // Longitude of ascending node
    if (n.y < 0) {
      o = 2 * Math.PI - o;
    }

    const q = r.dot(v);
    let nu = Math.acos(ev.dot(r) / e / rl); // True anomaly
    if (q < 0) {
      nu = 2 * Math.PI - nu;
    }
    const E = Math.atan2(q / Math.sqrt(a * mu), 1 - rl / a); // Eccentric anomaly
    const m = E - e * Math.sin(E); // Mean anomaly

    const cw = (r.x * Math.cos(o) + r.y * Math.sin(o)) / rl;
    const sw = equatorial ? ((r.y * Math.cos(o) - r.x * Math.sin(o)) / rl) : (r.z / (rl * Math.sin(i)));
    const w = Math.atan2(((i >= Math.PI) ? -1 : 1) * sw, cw) - nu; // Argument of periapsis

    const ret = new Orbit(a, e, i, o, w, m);
    ret.extras = {
      trueAnomaly: nu,
      eccentricAnomaly: E,
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
    const mu = Force.G * (primaryMass + secondaryMass); // Gravitational parameter

    // Shortcuts for Kepler elements
    const a = this.semiMajorAxis, e = this.eccentricity, i = this.inclination;
    const o = this.longitudeOfAscendingNode, w = this.argumentOfPeriapsis, m = this.meanAnomaly;
    const cw = Math.cos(w), sw = Math.sin(w);
    const co = Math.cos(o), so = Math.sin(o);
    const ci = Math.cos(i), si = Math.sin(i);

    // Calculate eccentric anomaly using Newton's method
    let j = 0, E = m;
    let f = E - e * Math.sin(E) - m;
    while (Math.abs(f) > 1e-6 && j < 30) {
      E = E - f / (1 - e * Math.cos(E));
      f = E - e * Math.sin(E) - m;
      j++;
    }

    const nu = 2 * Math.atan2(Math.sqrt(1 + e) * // True anomaly
      Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));

    const rl = a * (1 - e * Math.cos(E)); // Distance to central body
    const r = new Vector3(rl * Math.cos(nu), rl * Math.sin(nu), 0); // Position in orbital frame
    const v = new Vector3(-Math.sin(E), Math.sqrt(1 - e ** 2) * Math.cos(E), 0)
      .multiplyScalar(Math.sqrt(mu * a) / rl); // Velocity vector in the orbital frame

    return [
      new Vector3(
        r.x * (cw * co - sw * ci * so) - r.y * (sw * co + cw * ci * so),
        r.x * (sw * si) + r.y * (cw * si),
        r.x * (cw * so + sw * ci * co) + r.y * (cw * ci * co - sw * so),
      ),
      new Vector3(
        v.x * (cw * co - sw * ci * so) - v.y * (sw * co + cw * ci * so),
        v.x * (sw * si) + v.y * (cw * si),
        v.x * (cw * so + sw * ci * co) + v.y * (cw * ci * co - sw * so),
      ),
    ];
  }
}
