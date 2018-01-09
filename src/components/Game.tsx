import React from 'react';
import { HashRouter, Link, Route, Switch } from 'react-router-dom';

import Main from '../pages/Main';
import Help from '../pages/Help';
import Debug from '../pages/Debug';
import World from '../model/World';
import bind from '../utils/bind';

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