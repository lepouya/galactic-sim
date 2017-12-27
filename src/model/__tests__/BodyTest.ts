import 'mocha';
import { expect } from 'chai';
import { Vector3 } from 'three';

import Body from '../Body';
import Orbit from '../../utils/Orbit';

const pi = Math.PI;

const sunMass = 1.989e+30;
const earthMass = 5.972e+24;
const earthDist = 1.496e+11;
const earthSpeed = 2.978e+4;

const expectVector =
  (vec: Vector3, x: number, y: number, z: number) =>
    expect(vec.clone().round()).to.deep.equal(new Vector3(x, y, z).round());

const tol = (a, b, t) => t * (1 + Math.max(Math.abs(a), Math.abs(b)));
function expectV(v1: Vector3, v2: Vector3, t = 0.01, msg = '') {
  expect(v1.x).to.be.approximately(v2.x, tol(v1.x, v2.x, t), msg + 'x');
  expect(v1.y).to.be.approximately(v2.y, tol(v1.y, v2.y, t), msg + 'y');
  expect(v1.z).to.be.approximately(v2.z, tol(v1.z, v2.z, t), msg + 'z');
}

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

describe('Orbit conversion', () => {
  let star: Body;
  let earth1: Body;
  let earth2: Body;

  beforeEach('Setup bodies', () => {
    star = new Body('0', 0);
    star.mass = sunMass;

    earth1 = new Body('1', 0);
    earth1.parent = star;
    earth1.mass = earthMass;
    earth1.position = new Vector3(earthDist, 0, 0);

    earth2 = new Body('2', 0);
    earth2.parent = star;
    earth2.mass = earthMass;
  });

  function runOrbitalTests(dist = earthDist, speed = earthSpeed, further = true, closer = true) {
    for (let i = 0; i < 50; i++) {
      let t = i * i / 2 * 60 * 60;
      earth1.simulate(t, Body.SimulationLevel.TwoBody);
      earth2.orbit = earth1.orbit;

      expectV(earth2.position, earth1.position, 0.01, `r @ ${t} `);
      expectV(earth2.velocity, earth1.velocity, 0.01, `v @ ${t} `);

      if (further) {
        expect(earth1.position.length()).to.be.greaterThan(dist * 0.99, `1r> @ ${t}`);
        expect(earth2.position.length()).to.be.greaterThan(dist * 0.99, `2r> @ ${t}`);
        expect(earth1.velocity.length()).to.be.lessThan(speed * 1.01, `1v< @ ${t}`);
        expect(earth2.velocity.length()).to.be.lessThan(speed * 1.01, `2v< @ ${t}`);
      }

      if (closer) {
        expect(earth1.position.length()).to.be.lessThan(dist * 1.01, `1r< @ ${t}`);
        expect(earth2.position.length()).to.be.lessThan(dist * 1.01, `2r< @ ${t}`);
        expect(earth1.velocity.length()).to.be.greaterThan(speed * 0.99, `1v> @ ${t}`);
        expect(earth2.velocity.length()).to.be.greaterThan(speed * 0.99, `2v> @ ${t}`);
      }
    }
  }

  it('equatorial circular orbit', () => {
    earth1.velocity = new Vector3(0, 0, earthSpeed);
    runOrbitalTests();
  });

  it('polar circular orbit', () => {
    earth1.velocity = new Vector3(0, earthSpeed, 0);
    runOrbitalTests();
  });

  it('slanted ++ circular orbit', () => {
    earth1.velocity = new Vector3(0, earthSpeed / Math.sqrt(2), earthSpeed / Math.sqrt(2));
    runOrbitalTests();
  });

  it('slanted -- circular orbit', () => {
    earth1.velocity = new Vector3(0, -earthSpeed / Math.sqrt(2), -earthSpeed / Math.sqrt(2));
    runOrbitalTests();
  });

  it('slanted +- circular orbit', () => {
    earth1.velocity = new Vector3(0, earthSpeed / 2, -earthSpeed * Math.sqrt(3) / 2);
    runOrbitalTests();
  });

  it('slanted -+ circular orbit', () => {
    earth1.velocity = new Vector3(0, earthSpeed / 2, earthSpeed * Math.sqrt(3) / 2);
    runOrbitalTests();
  });

  it('reverse equatorial circular orbit', () => {
    earth1.velocity = new Vector3(0, 0, -earthSpeed);
    runOrbitalTests();
  });

  it('reverse polar circular orbit', () => {
    earth1.velocity = new Vector3(0, -earthSpeed, 0);
    runOrbitalTests();
  });

  it('equatorial elliptic orbit', () => {
    earth1.velocity = new Vector3(0, 0, earthSpeed * 1.25);
    runOrbitalTests(earthDist, earthSpeed * 1.25, true, false);
  });

  it('polar elliptic orbit', () => {
    earth1.velocity = new Vector3(0, earthSpeed * 1.25, 0);
    runOrbitalTests(earthDist, earthSpeed * 1.25, true, false);
  });

  it('reverse equatorial elliptic orbit', () => {
    earth1.velocity = new Vector3(0, 0, -earthSpeed * 1.25);
    runOrbitalTests(earthDist, earthSpeed * 1.25, true, false);
  });

  it('reverse polar elliptic orbit', () => {
    earth1.velocity = new Vector3(0, -earthSpeed * 1.25, 0);
    runOrbitalTests(earthDist, earthSpeed * 1.25, true, false);
  });

  it('slanted elliptic orbit', () => {
    earth1.velocity = new Vector3(0, earthSpeed * 1.25 / Math.sqrt(2), earthSpeed * 1.25 / Math.sqrt(2));
    runOrbitalTests(earthDist, earthSpeed * 1.25, true, false);
  });

  it('reverse slanted elliptic orbit', () => {
    earth1.velocity = new Vector3(0, earthSpeed * 0.75 / 2, - earthSpeed * 0.75 * Math.sqrt(3) / 2);
    runOrbitalTests(earthDist, earthSpeed * 0.75, false, true);
  });
});

describe('Orbit prediction', () => {
  let star: Body;
  let earth1: Body;
  let earth2: Body;

  beforeEach('Setup bodies', () => {
    star = new Body('0', 0);
    star.mass = sunMass;

    earth1 = new Body('1', 0);
    earth1.parent = star;
    earth1.mass = earthMass;
    earth1.position = new Vector3(earthDist, 0, 0);

    earth2 = new Body('2', 0);
    earth2.parent = star;
    earth2.mass = earthMass;
  });

  function runOrbitalTests(dist = earthDist, speed = earthSpeed, further = true, closer = true) {
    earth2.orbit = earth1.orbit;

    for (let i = 0; i < 50; i++) {
      let t = i * i / 2 * 60 * 60;
      earth1.orbit = earth2.orbit;
      earth1.simulate(t, Body.SimulationLevel.TwoBody);
      earth2.predictOrbit(t);

      expectV(earth2.position, earth1.position, 0.01, `r @ ${t} `);
      expectV(earth2.velocity, earth1.velocity, 0.01, `v @ ${t} `);

      if (further) {
        expect(earth1.position.length()).to.be.greaterThan(dist * 0.99, `1r> @ ${t}`);
        expect(earth2.position.length()).to.be.greaterThan(dist * 0.99, `2r> @ ${t}`);
        expect(earth1.velocity.length()).to.be.lessThan(speed * 1.01, `1v< @ ${t}`);
        expect(earth2.velocity.length()).to.be.lessThan(speed * 1.01, `2v< @ ${t}`);
      }

      if (closer) {
        expect(earth1.position.length()).to.be.lessThan(dist * 1.01, `1r< @ ${t}`);
        expect(earth2.position.length()).to.be.lessThan(dist * 1.01, `2r< @ ${t}`);
        expect(earth1.velocity.length()).to.be.greaterThan(speed * 0.99, `1v> @ ${t}`);
        expect(earth2.velocity.length()).to.be.greaterThan(speed * 0.99, `2v> @ ${t}`);
      }
    }
  }

  it('equatorial circular orbit', () => {
    earth1.velocity = new Vector3(0, 0, earthSpeed);
    runOrbitalTests();
  });

  it('polar circular orbit', () => {
    earth1.velocity = new Vector3(0, earthSpeed, 0);
    runOrbitalTests();
  });

  it('slanted ++ circular orbit', () => {
    earth1.velocity = new Vector3(0, earthSpeed / Math.sqrt(2), earthSpeed / Math.sqrt(2));
    runOrbitalTests();
  });

  it('slanted -- circular orbit', () => {
    earth1.velocity = new Vector3(0, -earthSpeed / Math.sqrt(2), -earthSpeed / Math.sqrt(2));
    runOrbitalTests();
  });

  it('slanted +- circular orbit', () => {
    earth1.velocity = new Vector3(0, earthSpeed / 2, -earthSpeed * Math.sqrt(3) / 2);
    runOrbitalTests();
  });

  it('slanted -+ circular orbit', () => {
    earth1.velocity = new Vector3(0, earthSpeed / 2, earthSpeed * Math.sqrt(3) / 2);
    runOrbitalTests();
  });

  it('reverse equatorial circular orbit', () => {
    earth1.velocity = new Vector3(0, 0, -earthSpeed);
    runOrbitalTests();
  });

  it('reverse polar circular orbit', () => {
    earth1.velocity = new Vector3(0, -earthSpeed, 0);
    runOrbitalTests();
  });

  it('equatorial elliptic orbit', () => {
    earth1.velocity = new Vector3(0, 0, earthSpeed * 1.25);
    runOrbitalTests(earthDist, earthSpeed * 1.25, true, false);
  });

  it('polar elliptic orbit', () => {
    earth1.velocity = new Vector3(0, earthSpeed * 1.25, 0);
    runOrbitalTests(earthDist, earthSpeed * 1.25, true, false);
  });

  it('reverse equatorial elliptic orbit', () => {
    earth1.velocity = new Vector3(0, 0, -earthSpeed * 1.25);
    runOrbitalTests(earthDist, earthSpeed * 1.25, true, false);
  });

  it('reverse polar elliptic orbit', () => {
    earth1.velocity = new Vector3(0, -earthSpeed * 1.25, 0);
    runOrbitalTests(earthDist, earthSpeed * 1.25, true, false);
  });

  it('slanted elliptic orbit', () => {
    earth1.velocity = new Vector3(0, earthSpeed * 1.25 / Math.sqrt(2), earthSpeed * 1.25 / Math.sqrt(2));
    runOrbitalTests(earthDist, earthSpeed * 1.25, true, false);
  });

  it('reverse slanted elliptic orbit', () => {
    earth1.velocity = new Vector3(0, earthSpeed * 0.75 / 2, - earthSpeed * 0.75 * Math.sqrt(3) / 2);
    runOrbitalTests(earthDist, earthSpeed * 0.75, false, true);
  });
});

describe('Hyperbolic orbits', () => {
  let star: Body;
  let earth1: Body;
  let earth2: Body;

  const solarEscape = 4.21272e+4;

  beforeEach('Setup bodies', () => {
    star = new Body('0', 0);
    star.mass = sunMass;

    earth1 = new Body('1', 0);
    earth1.parent = star;
    earth1.mass = earthMass;
    earth1.position = new Vector3(earthDist, 0, 0);

    earth2 = new Body('2', 0);
    earth2.parent = star;
    earth2.mass = earthMass;
  });

  function runOrbitalTests(dist = earthDist, speed = earthSpeed, further = true, closer = true, debug = false) {
    if (debug) {
      console.log(`start @ ${logB(earth1)}`);
    }
    earth2.orbit = earth1.orbit;

    for (let i = 0; i < 50; i++) {
      earth1.position = earth2.position;
      earth1.velocity = earth2.velocity;

      let t = i * i / 2 * 60 * 60;
      earth1.simulate(t, Body.SimulationLevel.TwoBody);
      earth2.predictOrbit(t);

      if (debug) {
        console.log(`A @ t=${t} ${logB(earth1)}`);
        console.log(`B @ t=${t} ${logB(earth2)}`);
      }

      expectV(earth2.position, earth1.position, 0.01, `r @ ${t} `);
      expectV(earth2.velocity, earth1.velocity, 0.01, `v @ ${t} `);

      if (further) {
        expect(earth1.position.length()).to.be.greaterThan(dist * 0.99, `1r> @ ${t}`);
        expect(earth2.position.length()).to.be.greaterThan(dist * 0.99, `2r> @ ${t}`);
        expect(earth1.velocity.length()).to.be.lessThan(speed * 1.01, `1v< @ ${t}`);
        expect(earth2.velocity.length()).to.be.lessThan(speed * 1.01, `2v< @ ${t}`);
      }

      if (closer) {
        expect(earth1.position.length()).to.be.lessThan(dist * 1.01, `1r< @ ${t}`);
        expect(earth2.position.length()).to.be.lessThan(dist * 1.01, `2r< @ ${t}`);
        expect(earth1.velocity.length()).to.be.greaterThan(speed * 0.99, `1v> @ ${t}`);
        expect(earth2.velocity.length()).to.be.greaterThan(speed * 0.99, `2v> @ ${t}`);
      }
    }
  }

  it('Equatorial parabolic escape', () => {
    earth1.velocity = new Vector3(0, 0, solarEscape);
    runOrbitalTests(earthDist, solarEscape, true, false);
  });

  it('Reverse equatorial parabolic escape', () => {
    earth1.velocity = new Vector3(0, 0, -solarEscape);
    runOrbitalTests(earthDist, solarEscape, true, false);
  });

  it('Polar parabolic escape', () => {
    earth1.velocity = new Vector3(0, solarEscape, 0);
    runOrbitalTests(earthDist, solarEscape, true, false);
  });

  it('Slanted parabolic escape', () => {
    earth1.velocity = new Vector3(0, solarEscape / Math.sqrt(2), -solarEscape / Math.sqrt(2));
    runOrbitalTests(earthDist, solarEscape, true, false);
  });

  it('Equatorial hyperbolic encounter', () => {
    earth1.velocity = new Vector3(-solarEscape * 1.5, 0, earthSpeed * 0.5);
    runOrbitalTests(earthDist, earth1.velocity.length(), false, true, true);
  });
});

const tf = (n: number) => Math.abs(n) < 10 ? n.toFixed(4) : n.toExponential(1);
const logV = (v: Vector3) => `[${tf(v.x)}, ${tf(v.y)}, ${tf(v.z)}]`;
const logO = (o: Orbit) =>
  `(a=${tf(o.semiMajorAxis)}, e=${tf(o.eccentricity)}, i=${tf(o.inclination)}, ` +
  `o=${tf(o.longitudeOfAscendingNode)}, w=${tf(o.argumentOfPeriapsis)}, m=${tf(o.meanAnomaly)}); ` +
  `q=${tf(o.extras.periapsis)}, Q=${tf(o.extras.apoapsis)}, P=${tf(o.extras.period)}`;
const logB = (b: Body) =>
  `(r=${logV(b.position)}, v=${logV(b.velocity)}); ` +
  `(r=${tf(b.position.length())}, v=${tf(b.velocity.length())}); ` +
  logO(b.orbit);
//*/