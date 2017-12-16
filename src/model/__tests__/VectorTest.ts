import 'mocha';
import { expect } from 'chai';

import vector from '../Vector';

const pi = Math.PI;

describe('vector basics', () => {

  it('origin should be zero', () => {
    const v = vector.cartesian();
    expect(v.isOrigin()).to.be.true;
  });

  it('up arrow on a sphere', () => {
    const v = vector.spherical(1);
    expect(v.magnitude()).to.be.closeTo(1, 0.01);
    expect(v.equals(vector.cartesian(0, 0, 1))).to.be.true;
    expect(v.equals(vector.cartesian(0, 1, 0))).to.be.false;
    expect(v.equals(vector.cartesian(1, 0, 0))).to.be.false;
  });

  it('basic cartesian addition', () => {
    const v = vector.cartesian(0, 0, 0)
      .add(vector.cartesian(1, 0, 0))
      .add(vector.cartesian(0, 1, 0))
      .add(vector.cartesian(0, 0, 1));
    expect(v.magnitude()).to.be.closeTo(Math.sqrt(3), 0.01);
    expect(v.equals(vector.cartesian(1, 1, 1))).to.be.true;
  });

  it('basic polar addition', () => {
    const v = vector.cylindrical(0, 0, 0)
      .add(vector.cylindrical(1, 0, 0))
      .add(vector.cylindrical(1, pi/2, 0))
      .add(vector.cylindrical(0, 9, 1));
    expect(v.magnitude()).to.be.closeTo(Math.sqrt(3), 0.01);
    expect(v.equals(vector.cartesian(1, 1, 1))).to.be.true;
  });

  it('basic spherical addition', () => {
    const v = vector.spherical(0, 0, 0)
      .add(vector.spherical(1, 0, 0))
      .add(vector.spherical(1, pi/2, pi/2))
      .add(vector.spherical(1, 0, pi/2));
    expect(v.magnitude()).to.be.closeTo(Math.sqrt(3), 0.01);
    expect(v.equals(vector.cartesian(1, 1, 1))).to.be.true;
  });
});