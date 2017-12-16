import Vector from './Vector';

export const G = 6.67408e-11; // Gravitational constant, [m^3/kg/s^2]

export default class Body {
  constructor(
    readonly id = Math.random().toString(36).substr(2, 9),

    public name = id,     // Display name of this body
    public parent?: Body, // Bodies with no parent use absolute coordinates

    public position = Vector.spherical(), // Center of body relative to parent position; [m]
    public velocity = Vector.spherical(), // Motion of body relative to parent position, [m/s]
    public axis = Vector.spherical(1),    // Main axis relative to parent axis, normalized
    public spin = Vector.spherical(),     // Angular momentum relative to body's axis, [rad/s][ccw]

    public mass = 0,   // Inertial mass, [kg]
    public radius = 0, // Distance of surface from body's position, [m]

    readonly children = new Set<Body>(), // Bodies under sphere of influence of this body

    protected lastUpdated: number = Date.now(),
  ) { }

  reparent(newParent: Body) {
    if (this.parent) {
      this.parent.children.delete(this);
    }

    this.parent = newParent;
    this.parent.children.add(this);
  }
}