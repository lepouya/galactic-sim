import { Vector3 } from "three";

/**
 * Force in Newtonian physics
 */
export default class force {
  /**
   * Gravitational constant, [m^3/kg/s^2]
   */
  static G = 6.67408e-11;

  /**
   * Find the gravitational force between two objects of mass m1,m2 that are d apart
   * @param m1 Mass of first object [kg]
   * @param m2 Mass of second object [kg]
   * @param d  Distance vector from first object to second [m]
   * @returns  Gravitational force that applies to first object from second [N]
   */
  static gravity(m1: number, m2: number, d: Vector3): Vector3 {
    return d.setLength(force.G * m1 * m2 / d.lengthSq());
  }

  /**
   * Find the distance object of mass m travels after applying the force f for dt amount of time
   * @param f  Force that is applied to the object [N]
   * @param m  Mass of the object [kg]
   * @param dt Amount of time that this force is being applied [s]
   * @returns  Displacement vector of the object [m]
   */
  static apply(f: Vector3, m: number, dt: number): Vector3 {
    return f.multiplyScalar(0.5 / m * (dt ** 2));
  }

  /**
   * Find how much force is needed to move an object of mass m at the speed of v after dt amount of time
   * @param m  Mass of the object being moved [kg]
   * @param v  Desired velocity of the object [m/s]
   * @param dt Amount of time it has to accelerate to that speed [s]
   * @returns  The force that needs to be applied to the object to reach desired speed [N]
   */
  static find(m: number, v: Vector3, dt: number): Vector3 {
    return v.multiplyScalar(2.0 * m / dt);
  }
}