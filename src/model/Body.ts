import Vector from './Vector';
import force from '../utils/force';

export default class Body {
  constructor(
    readonly id = Math.random().toString(36).substr(2, 9),

    public name = id,     // Display name of this body
    public parent?: Body, // Bodies with no parent use absolute coordinates

    public axis = Vector.spherical(1),    // Main axis relative to parent axis, normalized

    public position = Vector.spherical(), // Central position relative to parent's position and axis, [m^3]
    public velocity = Vector.spherical(), // Motion relative to parent's axis, [m/s]
    public rotation = Vector.spherical(), // Rotation relative to body's axis, normalized
    public spin = Vector.spherical(),     // Angular momentum relative to body's axis, [rad/s; ccw]

    public mass = 0,   // Inertial mass, [kg]
    public radius = 0, // Distance of surface from body's position, [m]

    readonly children = new Set<Body>(), // Bodies under sphere of influence of this body

    protected lastUpdated: number = Date.now() / 1000.0, // Last time vectors were calculated, [s]
  ) {
    this.reParent(this.parent);
  }

  reParent(newParent?: Body) {
    if (this.parent) {
      this.parent.children.delete(this);
    }

    this.parent = newParent;

    if (this.parent) {
      this.parent.children.add(this);
    }
  }

  getAbsolutePosition(): Vector {
    if (this.parent) {
      let absParent = this.parent.getAbsolutePosition();
      // Do axis rotation calculation here
      return absParent.add(this.position);
    } else {
      return this.position.toCartesian();
    }
  }

  static readonly SimulationLevel = {
    NoGravity: 0,
    TwoBody: 1,
    NBody: 2,
    AllBodies: 3,
  }

  simulate(now: number, level: number) {
    // Find the delta-t and whether it's been long enough to simulate
    const dt = now - this.lastUpdated;
    if (Math.abs(dt) < 0.01) {
      return;
    }
    this.lastUpdated = now;

    // Force due to current velocity vector
    let f = this.velocity.toSpherical(true);
    f.rho = force.find(this.mass, f.rho, dt);

    // Gravity of parent
    if (level >= Body.SimulationLevel.TwoBody && this.parent) {
      let g = this.position.toSpherical(true);
      g.rho = force.gravity(this.parent.mass, this.mass, g.rho);
      f = f.add(g);
    }

    // Gravity of siblings and children

    // Gravity at grandparent level

    // Apply the motion
    f.rho = force.apply(f.rho, this.mass, dt);
    this.position = this.position.add(f);

    // Set the new velocity vector
    f.rho /= dt;
    this.velocity = f;

    // Calculate the rotation
  }
}