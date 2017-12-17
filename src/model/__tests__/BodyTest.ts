import 'mocha';
import { expect } from 'chai';

import Body from '../Body';
import Vector from '../Vector';

const pi = Math.PI;

describe('Basic body dynamics', () => {
  let body1: Body;
  let body2: Body;
  let body3: Body;

  beforeEach('Setup bodies', () => {
    body1 = new Body(
      undefined,            // Default id
      'Body 1',             // Name
      undefined,            // No parent. Use absolute coordinates
      Vector.spherical(1),  // Up in Z direction
      Vector.cartesian(),   // At origin
      Vector.spherical(),   // No motion
      Vector.cartesian(),   // Not rotates
      Vector.spherical(),   // No spin
      1e+9,                 // A million tons
      1e+3,                 // 1 km
      undefined,            // No children
      0,                    // Start at time 0
    );

    body2 = new Body(
      undefined,
      'Body 2',
      body1,
      Vector.spherical(1),  // Up in Z direction
      Vector.cartesian(1e+6), // Thousand kilometers away on x axis
      Vector.spherical(1),  // No motion
      Vector.cartesian(),   // No rotation
      Vector.spherical(),   // No spin
      1e+9,                 // A million tons
      1e+3,                 // 1 km
      undefined,            // No children
      0,                    // Start at time 0
    );
  });

  it('setup correctly', () => {
  });
});