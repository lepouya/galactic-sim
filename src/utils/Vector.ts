export enum CoordinateSystem {
  Cartesian = 0,
  Cylindrical = 1,
  Polar = 1,
  Spherical = 2,
}

const equalityThreshold = 1.0e-3;
const halfPi = Math.PI / 2.0;

const isCloseTo = (a: number, b: number) => Math.abs(a - b) < equalityThreshold;
const isAlmostZero = (a: number) => isCloseTo(a, 0.0);
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

  static Cartesian = CoordinateSystem.Cartesian;
  static Cylindrical = CoordinateSystem.Cylindrical;
  static Polar = CoordinateSystem.Polar;
  static Spherical = CoordinateSystem.Spherical;

  abstract convertTo(cs: CoordinateSystem): Vector;

  normalize(): Vector {
    const nv = this.convertTo(Vector.Spherical);
    nv.c1 = 1.0;
    return nv.convertTo(this.coordinateSystem);
  }

  neg(): Vector {
    const nv = this.convertTo(Vector.Cartesian);
    nv.c1 = -nv.c1;
    nv.c2 = -nv.c2;
    nv.c3 = -nv.c3;
    return nv.convertTo(this.coordinateSystem);
  }

  add(other: Vector): Vector {
    const nv1 = this.convertTo(Vector.Cartesian);
    const nv2 = other.convertTo(Vector.Cartesian);
    nv1.c1 += nv2.c1;
    nv1.c2 += nv2.c2;
    nv1.c3 += nv2.c3;
    return nv1.convertTo(this.coordinateSystem);
  }

  sub(other: Vector) {
    const nv1 = this.convertTo(Vector.Cartesian);
    const nv2 = other.convertTo(Vector.Cartesian);
    nv1.c1 -= nv2.c1;
    nv1.c2 -= nv2.c2;
    nv1.c3 -= nv2.c3;
    return nv1.convertTo(this.coordinateSystem);
  }

  angle(other: Vector) {
    return this.sub(other).convertTo(Vector.Spherical).normalize();
  }

  equals(other: Vector) {
    return this.sub(other).isOrigin();
  }

  magnitude() {
    return this.convertTo(Vector.Spherical).rho;
  }

  isOrigin() {
    return isAlmostZero(this.magnitude());
  }

  isFlat() {
    return isAlmostZero(this.convertTo(Vector.Cartesian).z);
  }

  private _verifyAndReturn<T>(v: T, cs1: CoordinateSystem, cs2?: CoordinateSystem) {
    if (this.coordinateSystem == cs1 || this.coordinateSystem == cs2) {
      return v;
    }
    throw new Error("Wrong coordinate type.");
  }

  get x() { return this._verifyAndReturn(this.c1, Vector.Cartesian); }
  set x(v) { this.c1 = this._verifyAndReturn(v, Vector.Cartesian); }

  get y() { return this._verifyAndReturn(this.c2, Vector.Cartesian); }
  set y(v) { this.c2 = this._verifyAndReturn(v, Vector.Cartesian); }

  get z() { return this._verifyAndReturn(this.c3, Vector.Cartesian, Vector.Cylindrical); }
  set z(v) { this.c3 = this._verifyAndReturn(v, Vector.Cartesian, Vector.Cylindrical); }

  get r() { return this.rho; }
  set r(v) { this.rho = v; }

  get rho() { return this._verifyAndReturn(this.c1, Vector.Cylindrical, Vector.Spherical); }
  set rho(v) { this.c1 = this._verifyAndReturn(v, Vector.Cylindrical, Vector.Spherical); }

  get theta() { return this._verifyAndReturn(this.c2, Vector.Cylindrical, Vector.Spherical); }
  set theta(v) { this.c2 = this._verifyAndReturn(v, Vector.Cylindrical, Vector.Spherical); }

  get phi() { return this._verifyAndReturn(this.c3, Vector.Spherical); }
  set phi(v) { this.c3 = this._verifyAndReturn(v, Vector.Spherical); }

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
    super(Vector.Cartesian, x, y, z);
  }

  convertTo(cs: CoordinateSystem): Vector {
    switch (cs) {
      case CoordinateSystem.Cartesian:
        return new CartesianVector(
          this.c1,
          this.c2,
          this.c3,
        );

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
    super(Vector.Cylindrical, r, t, z);
  }

  convertTo(cs: CoordinateSystem): Vector {
    switch (cs) {
      case CoordinateSystem.Cartesian:
        return new CartesianVector(
          this.c1 * Math.cos(this.c2),
          this.c1 * Math.sin(this.c2),
          this.c3,
        );

      case CoordinateSystem.Cylindrical:
        return new CylindricalVector(
          this.c1,
          this.c2,
          this.c3,
        );

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
    super(Vector.Spherical, r, t, p);
  }

  convertTo(cs: CoordinateSystem): Vector {
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
        return new SphericalVector(
          this.c1,
          this.c2,
          this.c3,
        );
    }
  }
}