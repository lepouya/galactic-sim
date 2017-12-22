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

  getAbsolutePosition(posCache?: Map<string, Vector3>): Vector3 {
    if (posCache && posCache.has(this.id)) {
      return posCache.get(this.id)!;
    }

    let pos = this.position.clone();

    if (this._parent) {
      pos.applyAxisAngle(this._parent.axisNormal, this._parent.axisAngle)
        .add(this._parent.getAbsolutePosition(posCache));
    }

    if (posCache) {
      posCache.set(this.id, pos);
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

  simulate(now: number, level: number, posCache?: Map<string, Vector3>) {
    // Find the delta-t and whether it's been long enough to simulate
    const dt = now - this.lastUpdated;
    if (Math.abs(dt) < 0.001) {
      return;
    }
    this.lastUpdated = now;

    // Local position cache
    if (!posCache) {
      posCache = new Map<string, Vector3>();
    }

    // Force due to current velocity vector
    let f = force.find(1, this.velocity.clone(), dt);

    const addGravity = (b: Body) =>
      f.add(force.gravity(b.mass, 1,
        b.getAbsolutePosition(posCache).clone().sub(this.getAbsolutePosition(posCache))));

    // Gravity of parent
    if (level >= Body.SimulationLevel.TwoBody && this.parent) {
      addGravity(this.parent);
    }

    // Gravity of grandparent
    if (level >= Body.SimulationLevel.ThreeBody && this.parent && this.parent.parent) {
      addGravity(this.parent.parent);
    }

    // Gravity of children
    if (level >= Body.SimulationLevel.NBody) {
      this.children.forEach(child => addGravity(child));
    }

    // Gravity of siblings
    if (level >= Body.SimulationLevel.AllBodies && this.parent) {
      this.parent.children.forEach(sibling => (sibling == this) || addGravity(sibling));
    }

    // Gravity of uncles
    if (level >= Body.SimulationLevel.AllBodies && this.parent && this.parent.parent) {
      this.parent.parent.children.forEach(uncle => (uncle == this.parent) || addGravity(uncle));
    }

    // Apply the motion
    f = force.apply(f, 1, dt);
    this.position = this.position.add(f);

    // Set the new velocity vector
    this.velocity = f.divideScalar(dt);

    // TODO: Calculate the rotation
  }
}