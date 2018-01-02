import React from 'react';
import { HashRouter, Link, Route, Switch } from 'react-router-dom';

import Main from '../pages/Main';
import Help from '../pages/Help';
import Debug from '../pages/Debug';
import World from '../model/World';
import bind from '../utils/bind';
import Body from '../model/Body';
import Orbit from '../utils/Orbit';

export interface GameProps {
}

export interface GameState {
  lastSave: number;
  lastUpdate: number;
  timerId?: NodeJS.Timer;
}

export default class Game extends React.Component<GameProps, GameState> {
  constructor(props: GameProps) {
    super(props);

    this.state = {
      lastSave: Date.now(),
      lastUpdate: Date.now(),
      timerId: undefined,
    };

    this.load();
  }

  componentDidMount() {
    if (!this.state.timerId) {
      const timerId = setInterval(
        this.tick,
        100,
      );
      this.setState({ timerId });
    }
  }

  componentWillUnmount() {
    if (this.state.timerId) {
      clearInterval(this.state.timerId);
      this.setState({ timerId: undefined });
    }
  }

  @bind
  load() {
    const world = World.Instance;
    world.children.clear();
    world.lastUpdated = 0;

    const sun = new Body('sun', world.lastUpdated);
    world.children.add(sun);
    sun.mass = 1.989e+30;
    sun.radius = 6.957e+8;

    const earth = new Body('earth', world.lastUpdated);
    earth.parent = sun;
    earth.mass = 5.972e+24;
    earth.radius = 6.371e+6;
    earth.orbit = new Orbit(1.496e+11, 0.0167, 0, -0.196, 1.796, 0);
    // Axis tilt: 23.4 degrees

    const moon = new Body('moon', world.lastUpdated);
    moon.parent = earth;
    moon.mass = 7.347e+22;
    moon.radius = 1.737e+6;
    moon.orbit = new Orbit(3.844e+8, 0.0549, 0.31904619, 2.1831, 5.5528, 0);
    // Axis tilt: -23.4-1.54

    const iss = new Body('iss', world.lastUpdated);
    iss.parent = earth;
    iss.mass = 4.196e+5;
    iss.radius = 54.5;
    iss.orbit = new Orbit(6.731e+6, 0, 0.901, 2.23, 5.691, 3.142);
  }

  @bind
  tick() {
    const now = Date.now();
    const dt = now - this.state.lastUpdate;
    this.setState({ lastUpdate: now });

    const world = World.Instance;
    world.simulate(world.lastUpdated + dt / 1000 * 60);
  }

  render() {
    return (
      <HashRouter>
        <div>
          <header>
            <div className="top-bar">
              <div className="top-bar-left">
                <ul className="menu">
                  <li><Link to="/">Galactic Sim</Link></li>
                </ul>
              </div>
              <div className="top-bar-right">
                <ul className="menu">
                  <li><Link to="/help">Help</Link></li>
                  <li><Link to="/debug">Debug</Link></li>
                </ul>
              </div>
            </div>
          </header>
          <main>
            <Switch>
              <Route exact path="/" component={Main} />
              <Route path="/help" component={Help} />
              <Route path="/debug" component={Debug} />
            </Switch>
          </main>
        </div>
      </HashRouter>
    );
  }
}