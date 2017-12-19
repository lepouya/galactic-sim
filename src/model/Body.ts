import { Vector3 } from 'three';

import force from '../utils/force';

export default class Body {
  // Parent element.Bodies with no parent use absolute coordinates
  private _parent?: Body;

  // Main axis relative to parent axis, normalized, defined "up"
  private _axis = new Vector3(0, 1, 0);
  private _axisNormal = new Vector3();
  private _axisAngle = 0.0;

  // Central position relative to parent's position and axis, [m^3]
  public position = new Vector3();
  // Motion relative to parent's axis, [m/s]
  public velocity = new Vector3();

  // Rotation relative to body's axis, normalized
  public rotation = new Vector3();
  // Angular momentum relative to body's axis, [rad/s; ccw]
  public spin = new Vector3();

  // Inertial mass, [kg]
  public mass = 0;
  // Distance of surface from body's position, [m]
  public radius = 0;

  // Bodies under sphere of influence of this body
  readonly children = new Set<Body>();

  constructor(
    // Display name of this body
    public name: String,
    // Unique identifier for this body
    public readonly id = Math.random().toString(36).substr(2, 9),
    // Last time vectors were calculated, [s]
    protected lastUpdated: number = Date.now() / 1000.0,
  ) {
  }

  get parent() {
    return this._parent;
  }

  set parent(parent: Body | undefined) {
    if (this._parent) {
      this._parent.children.delete(this);
    }

    this._parent = parent;

    if (parent) {
      parent.children.add(this);
    }

    // TODO: Calculate new axis vector
  }

  get axis(): Vector3 {
    return this._axis;
  }

  set axis(axis: Vector3) {
    const up = new Vector3(0, 1, 0);
    this._axis = axis.clone().normalize();
    this._axisNormal.crossVectors(up, this._axis).normalize();
    this._axisAngle = up.angleTo(this._axis);
  }

  getAbsolutePosition(offset?: Vector3): Vector3 {
    let pos = offset
      ? offset.applyAxisAngle(this._axisNormal, this._axisAngle).add(this.position)
      : this.position.clone();

    return this._parent
      ? this._parent.getAbsolutePosition(pos)
      : pos;
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
    let m = force.find(this.mass, this.velocity.length(), dt);
    let f = this.velocity.clone().setLength(m);

    // Gravity of parent
    /*
    if (level >= Body.SimulationLevel.TwoBody && this.parent) {
      let g = this.position.toSpherical(true);
      g.rho = force.gravity(this.parent.mass, this.mass, g.rho);
      f = f.add(g);
    }
    */

    // Gravity of siblings and children

    // Gravity at grandparent level

    // Apply the motion
    f = f.setLength(force.apply(f.length(), this.mass, dt));
    this.position = this.position.add(f);

    // Set the new velocity vector
    this.velocity = f.divideScalar(dt);

    // TODO: Calculate the rotation
  }
}