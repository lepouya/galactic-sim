import approximately from '../utils/approximately';

export enum CoordinateSystem {
  Cartesian = 0,
  Cylindrical = 1,
  Polar = 1,
  Spherical = 2,
}

const halfPi = Math.PI / 2.0;
const mag = (a: number, b: number, c: number = 0.0) => Math.sqrt(a * a + b * b + c * c);

export default abstract class Vector {
  protected constructor(
    readonly coordinateSystem: CoordinateSystem,
    public c1: number,
    public c2: number,
    public c3: number
  ) { }

  static cartesian(x: number = 0.0, y: number = 0.0, z: number = 0.0): Vector {
    return new CartesianVector(x, y, z);
  }

  static cylindrical(rho: number = 0.0, theta: number = 0.0, z: number = 0.0): Vector {
    return new CylindricalVector(rho, theta, z);
  }

  static polar(rho: number = 0.0, theta: number = 0.0): Vector {
    return new CylindricalVector(rho, theta, 0.0);
  }

  static spherical(rho: number = 0.0, theta: number = 0.0, phi: number = 0.0): Vector {
    return new SphericalVector(rho, theta, phi);
  }

  abstract convertTo(cs: CoordinateSystem, copy?: Boolean): Vector;

  toCartesian(copy = false) {
    return this.convertTo(CoordinateSystem.Cartesian, copy);
  }

  toCylindrical(copy = false) {
    return this.convertTo(CoordinateSystem.Cylindrical, copy);
  }

  toSpherical(copy = false) {
    return this.convertTo(CoordinateSystem.Spherical, copy);
  }

  normalize(): Vector {
    const nv = this.toSpherical(true);
    nv.c1 = 1.0;
    return nv.convertTo(this.coordinateSystem);
  }

  neg(): Vector {
    const nv = this.toCartesian(true);
    nv.c1 = -nv.c1;
    nv.c2 = -nv.c2;
    nv.c3 = -nv.c3;
    return nv.convertTo(this.coordinateSystem);
  }

  add(other: Vector): Vector {
    const nv1 = this.toCartesian(true);
    const nv2 = other.toCartesian();
    nv1.c1 += nv2.c1;
    nv1.c2 += nv2.c2;
    nv1.c3 += nv2.c3;
    return nv1.convertTo(this.coordinateSystem);
  }

  sub(other: Vector) {
    const nv1 = this.toCartesian(true);
    const nv2 = other.toCartesian();
    nv1.c1 -= nv2.c1;
    nv1.c2 -= nv2.c2;
    nv1.c3 -= nv2.c3;
    return nv1.convertTo(this.coordinateSystem);
  }

  angle(other: Vector) {
    const av = this.sub(other).toSpherical();
    av.c1 = 1.0;
    return av;
  }

  rotate(axis: Vector, angle: number) {
    
  }

  equals(other: Vector) {
    return this.sub(other).isOrigin();
  }

  magnitude() {
    return this.toSpherical().rho;
  }

  isOrigin() {
    return approximately.zero(this.magnitude());
  }

  isFlat() {
    return approximately.zero(this.toCartesian().z);
  }

  private _verifyAndReturn<T>(v: T, cs1: CoordinateSystem, cs2?: CoordinateSystem) {
    if (this.coordinateSystem == cs1 || this.coordinateSystem == cs2) {
      return v;
    } else {
      return NaN;
    }
  }

  get x() { return this._verifyAndReturn(this.c1, CoordinateSystem.Cartesian); }
  set x(v) { this.c1 = this._verifyAndReturn(v, CoordinateSystem.Cartesian); }

  get y() { return this._verifyAndReturn(this.c2, CoordinateSystem.Cartesian); }
  set y(v) { this.c2 = this._verifyAndReturn(v, CoordinateSystem.Cartesian); }

  get z() { return this._verifyAndReturn(this.c3, CoordinateSystem.Cartesian, CoordinateSystem.Cylindrical); }
  set z(v) { this.c3 = this._verifyAndReturn(v, CoordinateSystem.Cartesian, CoordinateSystem.Cylindrical); }

  get r() { return this.rho; }
  set r(v) { this.rho = v; }

  get rho() { return this._verifyAndReturn(this.c1, CoordinateSystem.Cylindrical, CoordinateSystem.Spherical); }
  set rho(v) { this.c1 = this._verifyAndReturn(v, CoordinateSystem.Cylindrical, CoordinateSystem.Spherical); }

  get theta() { return this._verifyAndReturn(this.c2, CoordinateSystem.Cylindrical, CoordinateSystem.Spherical); }
  set theta(v) { this.c2 = this._verifyAndReturn(v, CoordinateSystem.Cylindrical, CoordinateSystem.Spherical); }

  get phi() { return this._verifyAndReturn(this.c3, CoordinateSystem.Spherical); }
  set phi(v) { this.c3 = this._verifyAndReturn(v, CoordinateSystem.Spherical); }

  get lambda() { return this.theta; }
  set lambda(v) { this.theta = v; }

  get delta() { return halfPi - this.phi; }
  set delta(v) { this.phi = halfPi - v; }

  get radial() { return this.rho; }
  set radial(v) { this.rho = v; }

  get vertical() { return this.z; }
  set vertical(v) { this.z = v; }

  get azimuthal() { return this.theta; }
  set azimuthal(v) { this.theta = v; }

  get zenithal() { return this.phi; }
  set zenithal(v) { this.phi = v; }

  get latitude() { return this.delta; }
  set latitude(v) { this.delta = v; }

  get longitude() { return this.lambda; }
  set longitude(v) { this.lambda = v; }

  get altitude() { return this.rho; }
  set altitude(v) { this.rho = v; }
}

export class CartesianVector extends Vector {
  constructor(x: number, y: number, z: number) {
    super(CoordinateSystem.Cartesian, x, y, z);
  }

  convertTo(cs: CoordinateSystem, copy = false): Vector {
    switch (cs) {
      case CoordinateSystem.Cartesian:
        if (!copy) {
          return this;
        } else {
          return new CartesianVector(
            this.c1,
            this.c2,
            this.c3,
          );
        }

      case CoordinateSystem.Cylindrical:
        return new CylindricalVector(
          mag(this.c1, this.c2),
          Math.atan2(this.c2, this.c1),
          this.c3,
        );

      case CoordinateSystem.Spherical:
        const r = mag(this.c1, this.c2, this.c3);
        return new SphericalVector(
          r,
          Math.atan2(this.c2, this.c1),
          Math.acos(this.c3 / r),
        );
    }
  }
}

export class CylindricalVector extends Vector {
  constructor(r: number, t: number, z: number) {
    super(CoordinateSystem.Cylindrical, r, t, z);
  }

  convertTo(cs: CoordinateSystem, copy = false): Vector {
    switch (cs) {
      case CoordinateSystem.Cartesian:
        return new CartesianVector(
          this.c1 * Math.cos(this.c2),
          this.c1 * Math.sin(this.c2),
          this.c3,
        );

      case CoordinateSystem.Cylindrical:
        if (!copy) {
          return this;
        } else {
          return new CylindricalVector(
            this.c1,
            this.c2,
            this.c3,
          );
        }

      case CoordinateSystem.Spherical:
        return new SphericalVector(
          mag(this.c1, this.c3),
          this.c2,
          Math.atan2(this.c1, this.c3),
        );
    }
  }
}

export class SphericalVector extends Vector {
  constructor(r: number, t: number, p: number) {
    super(CoordinateSystem.Spherical, r, t, p);
  }

  convertTo(cs: CoordinateSystem, copy = false): Vector {
    switch (cs) {
      case CoordinateSystem.Cartesian:
        return new CartesianVector(
          this.c1 * Math.cos(this.c2) * Math.sin(this.c3),
          this.c1 * Math.sin(this.c2) * Math.sin(this.c3),
          this.c1 * Math.cos(this.c3),
        );

      case CoordinateSystem.Cylindrical:
        return new CylindricalVector(
          this.c1 * Math.sin(this.c3),
          this.c2,
          this.c1 * Math.cos(this.c3),
        );

      case CoordinateSystem.Spherical:
        if (!copy) {
          return this;
        } else {
          return new SphericalVector(
            this.c1,
            this.c2,
            this.c3,
          );
        }
    }
  }
}