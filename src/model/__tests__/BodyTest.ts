import 'mocha';
import { expect } from 'chai';
import { Vector3 } from 'three';

import Body from '../Body';
import orbit from '../../utils/orbit';

const pi = Math.PI;
const expectVector =
  (vec: Vector3, x: number, y: number, z: number) =>
    expect(vec.clone().round()).to.deep.equal(new Vector3(x, y, z).round());

describe('Body placement', () => {
  let body1: Body;
  let body2: Body;
  let body3: Body;

  beforeEach('Setup bodies', () => {
    body1 = new Body('1', 0);

    body2 = new Body('2', 0);
    body2.parent = body1;
    body2.axis = new Vector3(0, 0, 1); // axis is facing the camera on z
    body2.position = new Vector3(1e+6, 0, 0); // 1000 km away on x

    body3 = new Body('3', 0);
    body3.parent = body2;
    body3.axis = new Vector3(0, 1, 0); // Facing normal "up" relative to parent
    body3.position = new Vector3(0, 10, 0); // 10 m away on y
  });

  it('correct parentage', () => {
    expect(body3).to.equal(body3);
    expect(body3.parent).to.equal(body2);
    expect(body3.parent.parent).to.equal(body1);
  });

  it('level-0 absolute positioning', () => {
    expectVector(body1.getAbsolutePosition(), 0, 0, 0);
    body2.parent = undefined;
    expectVector(body2.getAbsolutePosition(), 1e+6, 0, 0);
    body3.parent = undefined;
    expectVector(body3.getAbsolutePosition(), 0, 10, 0);
  });

  it('multi-level absolute positioning', () => {
    expectVector(body1.getAbsolutePosition(), 0, 0, 0);
    expectVector(body2.getAbsolutePosition(), 1e+6, 0, 0);
    expectVector(body3.getAbsolutePosition(), 1e+6, 0, 10);
  });

  it('axis tilt', () => {
    body1.position = new Vector3(1, 2, 3);
    body2.position = new Vector3(9, 8, 7);
    expectVector(body1.getAbsolutePosition(), 1, 2, 3);
    expectVector(body2.getAbsolutePosition(), 10, 10, 10);

    body2.axis = new Vector3(0, 1, 0);
    expectVector(body3.getAbsolutePosition(), 10, 20, 10);

    body2.axis = new Vector3(1, 1, 1);
    expectVector(body3.getAbsolutePosition(), 16, 16, 16);
  });

  it('multi axis tilt', () => {
    body1.axis = new Vector3(1, 1, 0);
    body2.axis = new Vector3(-1, 1, 0);
    expectVector(body1.getAbsolutePosition(), 0, 0, 0);

    body2.position = new Vector3(0, 10, 0);
    expectVector(body2.getAbsolutePosition(), 7, 7, 0);

    body2.position = new Vector3(0, 0, 10);
    expectVector(body2.getAbsolutePosition(), 0, 0, 10);

    body2.position = new Vector3(10, 0, 0);
    expectVector(body2.getAbsolutePosition(), 7, -7, 0);

    expectVector(body3.getAbsolutePosition(), 7, 3, 0);
  });
});

describe('Body motion', () => {
  let body1: Body;
  let body2: Body;
  let body3: Body;

  beforeEach('Setup bodies', () => {
    body1 = new Body('1', 0);
    body1.mass = 1e6;

    body2 = new Body('2', 0);
    body2.parent = body1;
    body2.mass = 1e3;
    body2.axis = new Vector3(0, 0, 1); // axis is facing the camera on z
    body2.position = new Vector3(1e+6, 0, 0); // 1000 km away on x
    body2.velocity = new Vector3(0, 1, 0); // moving up on y at 1 m/s

    body3 = new Body('3', 0);
    body3.parent = body2;
    body3.mass = pi;
    body3.axis = new Vector3(0, 1, 0); // Facing normal "up" relative to parent
    body3.position = new Vector3(0, 10, 0); // 10 m away on y
    body3.velocity = new Vector3(0, -5, 0); // moving down on y at 5 m/s
  });

  it('non-moving objects', () => {
    expectVector(body1.getAbsolutePosition(), 0, 0, 0);

    body1.simulate(0, Body.SimulationLevel.NoGravity);
    expectVector(body1.getAbsolutePosition(), 0, 0, 0);
    expectVector(body1.velocity, 0, 0, 0);

    body1.simulate(1, Body.SimulationLevel.NoGravity);
    expectVector(body1.getAbsolutePosition(), 0, 0, 0);
    expectVector(body1.velocity, 0, 0, 0);

    body1.simulate(1000, Body.SimulationLevel.NoGravity);
    expectVector(body1.getAbsolutePosition(), 0, 0, 0);
    expectVector(body1.velocity, 0, 0, 0);
  });

  it('no movement', () => {
    expectVector(body2.getAbsolutePosition(), 1000000, 0, 0);
    expectVector(body2.position, 1000000, 0, 0);
    expectVector(body2.velocity, 0, 1, 0);

    body2.simulate(0, Body.SimulationLevel.NoGravity);
    expectVector(body2.getAbsolutePosition(), 1000000, 0, 0);
    expectVector(body2.position, 1000000, 0, 0);
    expectVector(body2.velocity, 0, 1, 0);

    body2.simulate(0.0001, Body.SimulationLevel.NoGravity);
    expectVector(body2.getAbsolutePosition(), 1000000, 0, 0);
    expectVector(body2.position, 1000000, 0, 0);
    expectVector(body2.velocity, 0, 1, 0);
  });

  it('simple movement', () => {
    body2.simulate(1, Body.SimulationLevel.NoGravity);

    expectVector(body2.getAbsolutePosition(), 1000000, 1, 0);
    expectVector(body2.position, 1000000, 1, 0);
    expectVector(body2.velocity, 0, 1, 0);
  });

  it('stepwise movement', () => {
    body2.simulate(0.1, Body.SimulationLevel.NoGravity);
    expectVector(body2.getAbsolutePosition(), 1000000, 0, 0);
    expectVector(body2.position, 1000000, 0, 0);
    expectVector(body2.velocity, 0, 1, 0);

    body2.simulate(0.9, Body.SimulationLevel.NoGravity);
    expectVector(body2.getAbsolutePosition(), 1000000, 1, 0);
    expectVector(body2.position, 1000000, 1, 0);
    expectVector(body2.velocity, 0, 1, 0);

    body2.simulate(10, Body.SimulationLevel.NoGravity);
    expectVector(body2.getAbsolutePosition(), 1000000, 10, 0);
    expectVector(body2.position, 1000000, 10, 0);
    expectVector(body2.velocity, 0, 1, 0);
  });

  it('multi-body movement', () => {
    body1.simulate(1, Body.SimulationLevel.NoGravity);
    body2.simulate(1, Body.SimulationLevel.NoGravity);
    body3.simulate(1, Body.SimulationLevel.NoGravity);

    expectVector(body1.position, 0, 0, 0);
    expectVector(body1.velocity, 0, 0, 0);
    expectVector(body1.getAbsolutePosition(), 0, 0, 0);

    expectVector(body2.position, 1000000, 1, 0);
    expectVector(body2.velocity, 0, 1, 0);
    expectVector(body2.getAbsolutePosition(), 1000000, 1, 0);

    expectVector(body3.position, 0, 5, 0);
    expectVector(body3.velocity, 0, -5, 0);
    expectVector(body3.getAbsolutePosition(), 1000000, 1, 5);
  });
});

describe('Gravitational force', () => {
  let body1: Body;
  let body2: Body;
  let body3: Body;

  beforeEach('Setup bodies', () => {
    body1 = new Body('1', 0);
    body1.mass = 1e18;

    body2 = new Body('2', 0);
    body2.parent = body1;
    body2.mass = 1e13;
    body2.position = new Vector3(1000, 0, 0);

    body3 = new Body('3', 0);
    body3.parent = body2;
    body3.mass = 1e10;
    body3.position = new Vector3(10, 0, 0);
  });

  it('no simulation', () => {
    expectVector(body1.position, 0, 0, 0);
    expectVector(body1.velocity, 0, 0, 0);
    expectVector(body1.getAbsolutePosition(), 0, 0, 0);

    expectVector(body2.position, 1000, 0, 0);
    expectVector(body2.velocity, 0, 0, 0);
    expectVector(body2.getAbsolutePosition(), 1000, 0, 0);

    expectVector(body3.position, 10, 0, 0);
    expectVector(body3.velocity, 0, 0, 0);
    expectVector(body3.getAbsolutePosition(), 1010, 0, 0);
  });

  it('no movement', () => {
    body1.simulate(0, Body.SimulationLevel.TwoBody);
    body2.simulate(0, Body.SimulationLevel.TwoBody);
    body3.simulate(0, Body.SimulationLevel.TwoBody);

    expectVector(body1.position, 0, 0, 0);
    expectVector(body1.velocity, 0, 0, 0);
    expectVector(body1.getAbsolutePosition(), 0, 0, 0);

    expectVector(body2.position, 1000, 0, 0);
    expectVector(body2.velocity, 0, 0, 0);
    expectVector(body2.getAbsolutePosition(), 1000, 0, 0);

    expectVector(body3.position, 10, 0, 0);
    expectVector(body3.velocity, 0, 0, 0);
    expectVector(body3.getAbsolutePosition(), 1010, 0, 0);
  });

  it('no gravity', () => {
    body1.simulate(1, Body.SimulationLevel.NoGravity);
    body2.simulate(1, Body.SimulationLevel.NoGravity);
    body3.simulate(1, Body.SimulationLevel.NoGravity);

    expectVector(body1.position, 0, 0, 0);
    expectVector(body1.velocity, 0, 0, 0);
    expectVector(body1.getAbsolutePosition(), 0, 0, 0);

    expectVector(body2.position, 1000, 0, 0);
    expectVector(body2.velocity, 0, 0, 0);
    expectVector(body2.getAbsolutePosition(), 1000, 0, 0);

    expectVector(body3.position, 10, 0, 0);
    expectVector(body3.velocity, 0, 0, 0);
    expectVector(body3.getAbsolutePosition(), 1010, 0, 0);
  });

  it('1-step gravity', () => {
    body1.simulate(1, Body.SimulationLevel.TwoBody);
    body2.simulate(1, Body.SimulationLevel.TwoBody);
    body3.simulate(1, Body.SimulationLevel.TwoBody);

    expectVector(body1.position, 0, 0, 0);
    expectVector(body1.velocity, 0, 0, 0);
    expectVector(body1.getAbsolutePosition(), 0, 0, 0);

    expectVector(body2.position, 933, 0, 0);
    expectVector(body2.velocity, -67, 0, 0);
    expectVector(body2.getAbsolutePosition(), 933, 0, 0);

    expectVector(body3.position, 3, 0, 0);
    expectVector(body3.velocity, -7, 0, 0);
    expectVector(body3.getAbsolutePosition(), 937, 0, 0);
  });

  it('accelerated gravity', () => {
    body1.simulate(1, Body.SimulationLevel.TwoBody);
    body2.simulate(1, Body.SimulationLevel.TwoBody);
    body3.simulate(1, Body.SimulationLevel.TwoBody);

    body1.simulate(2, Body.SimulationLevel.TwoBody);
    body2.simulate(2, Body.SimulationLevel.TwoBody);
    body3.simulate(2, Body.SimulationLevel.TwoBody);

    expectVector(body2.position, 790, 0, 0);
    expectVector(body2.velocity, -143, 0, 0);
    expectVector(body2.getAbsolutePosition(), 790, 0, 0);

    expectVector(body3.position, -64, 0, 0);
    expectVector(body3.velocity, -67, 0, 0);
    expectVector(body3.getAbsolutePosition(), 726, 0, 0);
  });

  it('orbiting', () => {
    const orbitalDistance = 10;
    const orbitalSpeed = 8.173;
    body3.position = new Vector3(orbitalDistance, 0, 0);
    body3.velocity = new Vector3(0, 0, orbitalSpeed);

    for (let i = 0; i < 100; i++) {
      for (let j = 0; j < 1000; j++) {        
        body3.simulate(i + (j / 1000), Body.SimulationLevel.TwoBody);
      }
      expect(body3.position.length()).to.be.approximately(orbitalDistance, 0.1);
      expect(body3.velocity.length()).to.be.approximately(orbitalSpeed, 0.1);
    }
  });
});

const tf = (n: number) => n.toFixed(1);
const logV = (v: Vector3) => `[${tf(v.x)}, ${tf(v.y)}, ${tf(v.z)}]`;
const logO = (o: orbit) =>
  `(a=${tf(o.semiMajorAxis)}, e=${tf(o.eccentricity)}, i=${tf(o.inclination)}, ` +
  `o=${tf(o.longitudeOfAscendingNode)}, w=${tf(o.argumentOfPeriapsis)}, m=${tf(o.meanAnomaly)}); ` +
  `TA=${tf(o.extras.trueAnomaly)}, EA=${tf(o.extras.eccentricAnomaly)}, TL=${tf(o.extras.trueLongitude)}, ` +
  `per=${tf(o.extras.periapsis)}, apo=${tf(o.extras.apoapsis)}, P=${tf(o.extras.period)}`;
const logB = (b: Body) =>
  `(r=${logV(b.position)}, v=${logV(b.velocity)}); ` +
  `(r=${tf(b.position.length())}, v=${tf(b.velocity.length())}); ` +
  logO(orbit.fromCartesian(b.parent.mass, b.mass, b.position, b.velocity));
/*
        let body4 = new Body('4', 0); body4.mass = body3.mass; body4.parent = body3.parent;
        if (j % 100 == 0) {
          [body4.position, body4.velocity] = orbit
            .fromCartesian(body2.mass, body3.mass, body3.position, body3.velocity)
            .toCartesian(body2.mass, body3.mass);
          console.log(`t=${tf(i + j/1000)}, ${logB(body3)}`);
          console.log(`  ---- ${logB(body4)}`);
        }
*/