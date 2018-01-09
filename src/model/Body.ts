import { Vector3, Euler } from 'three';
import Force from '../utils/Force';
import Orbit from '../utils/Orbit';
import approximately from '../utils/approximately';

const tau = 2 * Math.PI;

export default class Body {
  // Display name of this body
  public name: string;

  // Parent element.Bodies with no parent use absolute coordinates
  private _parent?: Body;

  // Main axis relative to parent axis, normalized, defines "up"
  private _axis = new Vector3(0, 1, 0);
  protected axisAbsolute = new Vector3(0, 1, 0);
  protected axisNormal = new Vector3();
  protected axisAngle = 0.0;

  // Central position relative to parent's position and axis, [m^3]
  public position = new Vector3();
  // Motion relative to parent's axis, [m/s]
  public velocity = new Vector3();

  // Orbit prediction for this body
  private _orbit?: Orbit;

  // Rotation relative to body's axis
  public rotation = new Euler();
  // Angular momentum relative to body's axis, [rad/s; ccw]
  public spin = new Euler();

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
    protected lastUpdated: number = Date.now() / 1000,
  ) {
    this.name = id;
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

    // Force recalculation of the orbit
    this._orbit = undefined;
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

  get orbit() {
    if (!this._orbit) {
      this._orbit = Orbit.fromCartesian(
        this._parent ? this._parent.mass : 0,
        this.mass,
        this.position,
        this.velocity,
      );
    }

    return this._orbit;
  }

  set orbit(orbit: Orbit) {
    this._orbit = undefined;
    [this.position, this.velocity] = orbit.toCartesian(this.parent ? this.parent.mass : 0, this.mass);
  }

  validOrbit() {
    const orbit = this.orbit;
    const valid = (x: number) => (x === 0) || (!!x);
    return orbit &&
      valid(orbit.semiMajorAxis) && valid(orbit.eccentricity) && valid(orbit.inclination) &&
      valid(orbit.longitudeOfAscendingNode) && valid(orbit.argumentOfPeriapsis) && valid(orbit.meanAnomaly);
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

  protected calculateRotation(dt: number) {
    this.rotation.x = (this.rotation.x + dt * this.spin.x) % tau;
    this.rotation.y = (this.rotation.y + dt * this.spin.y) % tau;
    this.rotation.z = (this.rotation.z + dt * this.spin.z) % tau;
  }

  static readonly SimulationLevel = {
    NoGravity: 0, // Use only velocity vector
    TwoBody: 1, // + Gravity of parent
    ThreeBody: 3, // + Gravity of grandparent
    NBody: 4, // + Gravity of children
    AllBodies: 5, // + Gravity of siblings and uncles
  }

  simulate(now: number, level: number, posCache?: Map<string, Vector3>) {
    // Find the delta-t and whether it's been long enough to simulate
    const dt = now - this.lastUpdated;
    if (approximately.zero(dt)) {
      return;
    }
    this.lastUpdated = now;

    // Local position cache
    if (!posCache) {
      posCache = new Map<string, Vector3>();
    }

    // Force due to current velocity vector
    let f = Force.find(1, this.velocity.clone(), dt);

    const addGravity = (b: Body) =>
      f.add(Force.gravity(b.mass, 1,
        b.getAbsolutePosition(posCache).clone().sub(this.getAbsolutePosition(posCache))));

    // Gravity of parent
    if (level >= Body.SimulationLevel.TwoBody && this.parent) {
      f.add(Force.gravity(this.parent.mass, 1, this.position.clone().negate()));
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
    f = Force.apply(f, 1, dt);
    this.position = this.position.add(f);

    // Set the new velocity vector
    this.velocity = f.divideScalar(dt);

    // Calculate the new Euler rotation parameters
    this.calculateRotation(dt);

    // Force recalculation of the orbit
    this._orbit = undefined;
  }

  predictOrbit(now: number, posCache?: Map<string, Vector3>) {
    // Find the delta-t and whether it's been long enough to simulate
    const dt = now - this.lastUpdated;
    this.lastUpdated = now;

    // Update the mean anomaly using meanAngularMotion
    this.orbit.meanAnomaly += dt * this.orbit.extras.meanAngularMotion;
    if (this.orbit.eccentricity < 1) {
      this.orbit.meanAnomaly %= tau;
    }

    // Convert the orbital motion back into Cartesian coordinates
    [this.position, this.velocity] = this.orbit.toCartesian(this.parent ? this.parent.mass : 0, this.mass);

    // Local position cache
    if (posCache && posCache.has(this.id)) {
      posCache.delete(this.id);
    }

    // Calculate the new Euler rotation parameters
    this.calculateRotation(dt);
  }

  save(): any {
    let res: any = {};

    res.id = this.id;
    res.name = this.name;
    res.updated = this.lastUpdated;
    if (this.parent) {
      res.parent = this.parent.id;
    }

    res.mass = this.mass;
    res.radius = this.radius;
    res.axis = this.axis.toArray();

    res.rotation = this.rotation.toVector3().toArray();
    res.spin = this.rotation.toVector3().toArray();

    if (!this.validOrbit()) {
      res.position = this.position.toArray();
      res.velocity = this.velocity.toArray();
    } else {
      const orbit = this.orbit;
      res.orbit = {
        semiMajorAxis: orbit.semiMajorAxis,
        eccentricity: orbit.eccentricity,
        inclination: orbit.inclination,
        longitudeOfAscendingNode: orbit.longitudeOfAscendingNode,
        argumentOfPeriapsis: orbit.argumentOfPeriapsis,
        meanAnomaly: orbit.meanAnomaly,
      };
    }

    return res;
  }

  saveAll(): any {
    return [].concat.apply(this.save(), Array.from(this.children).map(b => b.saveAll()));
  }

  load(data: any): Body {
    this.name = data.name || this.name;

    this.mass = data.mass || this.mass;
    this.radius = data.radius || this.radius;
    if (data.axis) {
      this.axis = new Vector3(
        data.axis[0] || this.axis.x,
        data.axis[1] || this.axis.y,
        data.axis[2] || this.axis.z);
    }

    if (data.rotation) {
      this.rotation = new Euler(
        data.rotation[0] || this.rotation.x,
        data.rotation[1] || this.rotation.y,
        data.rotation[2] || this.rotation.z);
    }
    if (data.spin) {
      this.spin = new Euler(
        data.spin[0] || this.spin.x,
        data.spin[1] || this.spin.y,
        data.spin[2] || this.spin.z);
    }
    if (data.position) {
      this.position = new Vector3(
        data.position[0] || this.position.x,
        data.position[1] || this.position.y,
        data.position[2] || this.position.z);
    }
    if (data.velocity) {
      this.velocity = new Vector3(
        data.velocity[0] || this.velocity.x,
        data.velocity[1] || this.velocity.y,
        data.velocity[2] || this.velocity.z);
    }

    if (data.orbit) {
      this.orbit = new Orbit(
        data.orbit.semiMajorAxis,
        data.orbit.eccentricity,
        data.orbit.inclination,
        data.orbit.longitudeOfAscendingNode,
        data.orbit.argumentOfPeriapsis,
        data.orbit.meanAnomaly,
      );
    }

    return this;
  }

  static loadNew(data: any): Body {
    return new Body(data.id || undefined, data.updated || 0).load(data);
  }
}