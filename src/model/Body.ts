import { Vector3 } from 'three';

import force from '../utils/force';

export default class Body {
  // Display name of this body
  public name: String;

  // Parent element.Bodies with no parent use absolute coordinates
  private _parent?: Body;

  // Main axis relative to parent axis, normalized, defined "up"
  private _axis = new Vector3(0, 1, 0);
  protected axisAbsolute = new Vector3(0, 1, 0);
  protected axisNormal = new Vector3();
  protected axisAngle = 0.0;

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
  public readonly children = new Set<Body>();

  constructor(
    // Unique identifier for this body
    public readonly id = Math.random().toString(36).substr(2, 9),
    // Last time vectors were calculated, [s]
    protected lastUpdated: number = Date.now() / 1000.0,
  ) {
    if (!this.name) {
      this.name = id;
    }
  }

  get parent() {
    return this._parent;
  }

  set parent(parent: Body | undefined) {
    if (this._parent) {
      this._parent.children.delete(this);
    }

    if (parent && (parent != this)) {
      this._parent = parent;
    } else {
      this._parent = undefined;
    }

    if (this._parent) {
      this._parent.children.add(this);
    }

    // TODO: Calculate new axis vector
  }

  get axis(): Vector3 {
    return this._axis;
  }

  set axis(axis: Vector3) {
    this._axis = axis.clone().normalize();
    this.axisAbsolute = this._axis.clone();
    if (this._parent) {
      this.axisAbsolute.applyAxisAngle(this._parent.axisNormal, this._parent.axisAngle);
    }

    const up = new Vector3(0, 1, 0);
    this.axisNormal.crossVectors(up, this.axisAbsolute).normalize();
    this.axisAngle = up.angleTo(this.axisAbsolute);
  }

  getAbsolutePosition(): Vector3 {
    let pos = this.position.clone();

    if (this._parent) {
      pos = pos
        .applyAxisAngle(this._parent.axisNormal, this._parent.axisAngle)
        .add(this._parent.getAbsolutePosition());
    }

    return pos;
  }

  static readonly SimulationLevel = {
    NoGravity:  0, // Use only velocity vector
    TwoBody:    1, // + Gravity of parent
    ThreeBody:  3, // + Gravity of grandparent
    NBody:      4, // + Gravity of children
    AllBodies:  5, // + Gravity of siblings and uncles
  }

  simulate(now: number, level: number) {
    // Find the delta-t and whether it's been long enough to simulate
    const dt = now - this.lastUpdated;
    if (Math.abs(dt) < 0.001) {
      return;
    }
    this.lastUpdated = now;

    // Force due to current velocity vector
    let f = force.find(this.mass, this.velocity, dt);

    // Gravity of parent
    if (level >= Body.SimulationLevel.TwoBody && this._parent) {
      f.add(force.gravity(this._parent.mass, this.mass, this.position));
    }

    // Apply the motion
    f = force.apply(f, this.mass, dt);
    this.position = this.position.add(f);

    // Set the new velocity vector
    this.velocity = f.divideScalar(dt);

    // TODO: Calculate the rotation
  }
}