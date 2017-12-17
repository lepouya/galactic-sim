// Force in Newtonian physics
export default class force {
  // Gravitational constant, [m^3/kg/s^2]
  static G = 6.67408e-11;

  // Find the gravitational force between two objects of mass m1,m2 that are d apart
  // [(kg, kg, m) -> N]
  static gravity(m1: number, m2: number, d: number) {
    return force.G * m1 * m2 / (d ** 2);
  }

  // Find the distance object of mass m travels after applying the force f for dt amount of time
  // [(N, kg, s) -> m]
  static apply(f: number, m: number, dt: number) {
    return 0.5 * (f / m) * (dt ** 2);
  }

  // Find how much force is needed to move an object of mass m at the speed of v after dt amount of time
  // [(kg, m/s, s) -> N]
  static find(m: number, v: number, dt: number) {
    return 2.0 * m * v / dt;
  }
}