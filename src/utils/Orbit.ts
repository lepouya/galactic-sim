import { Vector3 } from 'three';
import approximately from './approximately';
import unit from './unit';

export type OrbitalExtras = {
  trueAnomaly: number;
  eccentricAnomaly: number;
  trueLongitude: number;
  periapsis: number;
  apoapsis: number;
  period: number;
  meanAngularMotion: number;
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
    const mu = unit.G * (primaryMass + secondaryMass); // Gravitational parameter

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

    const f = Math.sqrt(Math.abs(1 - e) / (1 + e));
    let E = 2 * Math.atan(f * Math.tan(0.5 * nu)); // Eccentric anomaly
    let m = E - e * Math.sin(E); // Mean anomaly
    if (e > 1) { // Hyperbolic orbits
      E = 2 * Math.atanh(f * Math.tan(0.5 * nu));
      m = e * Math.sinh(E) - E;
    }

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
      meanAngularMotion: Math.sqrt(mu / Math.abs(a) ** 3),
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
    const mu = unit.G * (primaryMass + secondaryMass); // Gravitational parameter

    // Shortcuts for Kepler elements
    const a = this.semiMajorAxis, e = this.eccentricity, i = this.inclination;
    const o = this.longitudeOfAscendingNode, w = this.argumentOfPeriapsis, m = this.meanAnomaly;
    const cw = Math.cos(w), sw = Math.sin(w);
    const co = Math.cos(o), so = Math.sin(o);
    const ci = Math.cos(i), si = Math.sin(i);

    // Calculate eccentric anomaly using Newton's method
    let j = 0, E = m, du = 1;
    if (e < 1) {
      E = m + e * Math.sin(m) + 0.5 * e * e * Math.sin(2 * m);
      while ((Math.abs(du) > 1e-6) && (j++ < 30)) {
        const l0 = E - e * Math.sin(E);
        du = (m - l0) / (1 - e * Math.cos(E));
        E += du;
      }
    } else {
      let am = Math.abs(m);
      E = Math.log(2 * am / e + 1.8); // Danby guess
      while ((Math.abs(du) > 1e-6) && (j++ < 30)) {
        const fh = e * Math.sinh(E) - E - am;
        const dfh = e * Math.cosh(E) - 1;
        du = -fh / dfh;
        E += du;
      }
      if (m < 0) {
        E = -E;
      }
    }

    const cE = (e < 1) ? Math.cos(E) : Math.cosh(E), sE = (e < 1) ? Math.sin(E) : Math.sinh(E);

    const rl = a * (1 - e * cE); // Distance to central body
    const aa = Math.abs(a);
    const f = Math.sqrt(Math.abs(1 - e ** 2));
    const r = new Vector3(a * (cE - e), aa * sE * f, 0); // Position in orbital frame
    const v = new Vector3(-sE, f * cE, 0).multiplyScalar(Math.sqrt(mu * aa) / rl); // Velocity vector in the orbital frame

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

  /**
   * Fill all the orbital extra parameters without changing the current orbit
   * @param primaryMass   Mass of the central body
   * @param secondaryMass Mass of the orbiting body
   * @returns             The current orbit with the extras filled in
   */
  fillOrbitalExtras(primaryMass: number, secondaryMass: number) {
    const [r, v] = this.toCartesian(primaryMass, secondaryMass);
    const newOrbit = Orbit.fromCartesian(primaryMass, secondaryMass, r, v);
    this.extras = newOrbit.extras;
    return this;
  }

  /**
   * Deep copy this orbit object to a new object
   * @param m1 Mass of the central body, if applicable
   * @param m2 Mass of the orbiting body, if applicable
   * @returns  A deep copy of this orbit
   */
  deepCopy(m1?: number, m2?: number) {
    const newOrbit = new Orbit(
      this.semiMajorAxis,
      this.eccentricity,
      this.inclination,
      this.longitudeOfAscendingNode,
      this.argumentOfPeriapsis,
      this.meanAnomaly);

    if ((m1 !== undefined) && (m2 !== undefined)) {
      newOrbit.fillOrbitalExtras(m1, m2);
    }

    return newOrbit;
  }
}
