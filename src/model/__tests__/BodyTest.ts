import 'mocha';
import { expect } from 'chai';
import { Vector3 } from 'three';

import Body from '../Body';

const pi = Math.PI;

describe('Basic body placement', () => {
  let body1: Body;
  let body2: Body;
  let body3: Body;

  beforeEach('Setup bodies', () => {
    body1 = new Body('1', '1', 0);

    body2 = new Body('2', '2', 0);
    body2.parent = body1;
    body2.axis = new Vector3(0, 0, 1); // axis is facing the camera on z
    body2.position = new Vector3(1e+6, 0, 0); // 1000 km away on x

    body3 = new Body('3', '3', 0);
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
    expect(body1.getAbsolutePosition()).to.deep.equal(new Vector3(0, 0, 0));
    body2.parent = undefined;
    expect(body2.getAbsolutePosition()).to.deep.equal(new Vector3(1e+6, 0, 0));
    body3.parent = undefined;
    expect(body3.getAbsolutePosition()).to.deep.equal(new Vector3(0, 10, 0));
  });

  it('multi-level absolute positioning', () => {
    expect(body1.getAbsolutePosition()).to.deep.equal(new Vector3(0, 0, 0));
    expect(body2.getAbsolutePosition()).to.deep.equal(new Vector3(1e+6, 0, 0));
    expect(body3.getAbsolutePosition().round()).to.deep.equal(new Vector3(1e+6, 0, 10));
  });

  it('axis tilt', () => {
    body1.position = new Vector3(1, 2, 3);
    body2.position = new Vector3(9, 8, 7);
    expect(body1.getAbsolutePosition()).to.deep.equal(new Vector3(1, 2, 3));
    expect(body2.getAbsolutePosition()).to.deep.equal(new Vector3(10, 10, 10));

    body2.axis = new Vector3(0, 1, 0);
    expect(body3.getAbsolutePosition()).to.deep.equal(new Vector3(10, 20, 10));

    body2.axis = new Vector3(1, 1, 1);
    expect(body3.getAbsolutePosition().round()).to.deep.equal(new Vector3(16, 16, 16));
  });

  it('multi axis tilt', () => {
    body1.axis = new Vector3(1, 1, 0);
    body2.axis = new Vector3(-1, 1, 0);
    expect(body1.getAbsolutePosition()).to.deep.equal(new Vector3(0, 0, 0));

    body2.position = new Vector3(0, 10, 0);
    expect(body2.getAbsolutePosition().round()).to.deep.equal(new Vector3(7, 7, 0));

    body2.position = new Vector3(0, 0, 10);
    expect(body2.getAbsolutePosition().round()).to.deep.equal(new Vector3(0, 0, 10));

    body2.position = new Vector3(10, 0, 0);
    expect(body2.getAbsolutePosition().round()).to.deep.equal(new Vector3(7, -7, 0));

    expect(body3.getAbsolutePosition().round()).to.deep.equal(new Vector3(7, 3, 0));
  });
});

describe('Basic body motion', () => {
  let body1: Body;
  let body2: Body;
  let body3: Body;

  beforeEach('Setup bodies', () => {
    body1 = new Body('1', '1', 0);
    body1.mass = 1e+9;    // A million tons
    body1.radius = 1e+3;  // 1 km

    body2 = new Body('2', '2', 0);
    body2.parent = body1;
    body2.mass = 1e+3; // 1000 kg
    body2.radius = 1;  // 1 m
    body2.axis = new Vector3(0, 0, 1); // axis is facing the camera on z
    body2.position = new Vector3(1e+6, 0, 0); // 1000 km away on x
    body2.velocity = new Vector3(0, 1, 0); // moving up on y at 1 m/s

    body3 = new Body('3', '3', 0);
    body3.parent = body2;
    body3.mass = 1; // 1 kg
    body3.radius = 0.01;  // 1 cm
    body3.axis = new Vector3(0, 1, 0); // Facing normal "up" relative to parent
    body3.position = new Vector3(0, 10, 0); // 10 m away on y
    body3.velocity = new Vector3(0, -5, 0); // moving down on y at 5 m/s
  });

  it('non-moving objects', () => {
    expect(body1.getAbsolutePosition().round())
      .to.deep.equal(new Vector3(0, 0, 0));

    body1.simulate(0, Body.SimulationLevel.NoGravity);
    expect(body1.getAbsolutePosition().round())
      .to.deep.equal(new Vector3(0, 0, 0));
    expect(body1.velocity.round())
      .to.deep.equal(new Vector3(0, 0, 0));

    body1.simulate(1, Body.SimulationLevel.NoGravity);
    expect(body1.getAbsolutePosition().round())
      .to.deep.equal(new Vector3(0, 0, 0));
    expect(body1.velocity.round())
      .to.deep.equal(new Vector3(0, 0, 0));

    body1.simulate(1000, Body.SimulationLevel.NoGravity);
    expect(body1.getAbsolutePosition().round())
      .to.deep.equal(new Vector3(0, 0, 0));
    expect(body1.velocity.round())
      .to.deep.equal(new Vector3(0, 0, 0));
  });

  it('no movement', () => {
    expect(body2.getAbsolutePosition().round())
      .to.deep.equal(new Vector3(1000000, 0, 0));
    expect(body2.position.round())
      .to.deep.equal(new Vector3(1000000, 0, 0));
    expect(body2.velocity.round())
      .to.deep.equal(new Vector3(0, 1, 0));

    body2.simulate(0, Body.SimulationLevel.NoGravity);
    expect(body2.getAbsolutePosition().round())
      .to.deep.equal(new Vector3(1000000, 0, 0));
    expect(body2.position.round())
      .to.deep.equal(new Vector3(1000000, 0, 0));
    expect(body2.velocity.round())
      .to.deep.equal(new Vector3(0, 1, 0));

    body2.simulate(0.0001, Body.SimulationLevel.NoGravity);
    expect(body2.getAbsolutePosition().round())
      .to.deep.equal(new Vector3(1000000, 0, 0));
    expect(body2.position.round())
      .to.deep.equal(new Vector3(1000000, 0, 0));
    expect(body2.velocity.round())
      .to.deep.equal(new Vector3(0, 1, 0));
  });

  it('simple movement', () => {
    body2.simulate(1, Body.SimulationLevel.NoGravity);

    expect(body2.getAbsolutePosition().round())
      .to.deep.equal(new Vector3(1000000, 1, 0));
    expect(body2.position.round())
      .to.deep.equal(new Vector3(1000000, 1, 0));
    expect(body2.velocity.round())
      .to.deep.equal(new Vector3(0, 1, 0));
  });

  it('stepwise movement', () => {
    body2.simulate(0.1, Body.SimulationLevel.NoGravity);
    expect(body2.getAbsolutePosition().round())
      .to.deep.equal(new Vector3(1000000, 0, 0));
    expect(body2.position.round())
      .to.deep.equal(new Vector3(1000000, 0, 0));
    expect(body2.velocity.round())
      .to.deep.equal(new Vector3(0, 1, 0));

    body2.simulate(0.9, Body.SimulationLevel.NoGravity);
    expect(body2.getAbsolutePosition().round())
      .to.deep.equal(new Vector3(1000000, 1, 0));
    expect(body2.position.round())
      .to.deep.equal(new Vector3(1000000, 1, 0));
    expect(body2.velocity.round())
      .to.deep.equal(new Vector3(0, 1, 0));

    body2.simulate(10, Body.SimulationLevel.NoGravity);
    expect(body2.getAbsolutePosition().round())
      .to.deep.equal(new Vector3(1000000, 10, 0));
    expect(body2.position.round())
      .to.deep.equal(new Vector3(1000000, 10, 0));
    expect(body2.velocity.round())
      .to.deep.equal(new Vector3(0, 1, 0));
  });

  it('multi-body movement', () => {
    body1.simulate(1, Body.SimulationLevel.NoGravity);
    body2.simulate(1, Body.SimulationLevel.NoGravity);
    body3.simulate(1, Body.SimulationLevel.NoGravity);

    expect(body1.position.round()).to.deep.equal(new Vector3(0, 0, 0));
    expect(body1.velocity.round()).to.deep.equal(new Vector3(0, 0, 0));
    expect(body1.getAbsolutePosition().round()).to.deep.equal(new Vector3(0, 0, 0));

    expect(body2.position.round()).to.deep.equal(new Vector3(1000000, 1, 0));
    expect(body2.velocity.round()).to.deep.equal(new Vector3(0, 1, 0));
    expect(body2.getAbsolutePosition().round()).to.deep.equal(new Vector3(1000000, 1, 0));

    expect(body3.position.round()).to.deep.equal(new Vector3(0, 5, 0));
    expect(body3.velocity.round()).to.deep.equal(new Vector3(0, -5, 0));
    expect(body3.getAbsolutePosition().round()).to.deep.equal(new Vector3(1000000, 1, 5));
  });
});
