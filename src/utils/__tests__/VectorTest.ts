import 'mocha';
import { expect } from 'chai';

import vector from '../Vector';

describe('vector basics', () => {

  it('origin should be zero', () => {
    const v = vector.cartesian();
    expect(v.isOrigin()).to.be.true;
  });
});