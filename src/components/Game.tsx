import React from 'react';
import { HashRouter, Link, Route, Switch } from 'react-router-dom';
import bind from '../utils/bind';

import Main from '../pages/Main';
import Help from '../pages/Help';
import Debug from '../pages/Debug';
import World from '../model/World';
import Clock from './Clock';

interface GameProps {
}

interface GameState {
  lastSave: number;
  lastUpdate: number;
  warp: number;
  timerId?: NodeJS.Timer;
}

export default class Game extends React.Component<GameProps, GameState> {
  constructor(props: GameProps) {
    super(props);

    this.state = {
      lastSave: Date.now(),
      lastUpdate: Date.now(),
      warp: 1,
      timerId: undefined,
    };
  }

  componentDidMount() {
    if (!this.state.timerId) {
      const timerId = setInterval(
        this.tick,
        1000 / 60,
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

    World.Instance.simulate(World.Instance.lastUpdated + dt / 1000 * this.state.warp);
  }

  @bind
  setWarp(warp: number) {
    this.setState({ warp });
  }

  render() {
    return (
      <HashRouter>
        <div>
          <header>
            <div className="top-bar" id="navBar" style={{padding: 0}}>
              <div className="top-bar-left">
                <ul className="menu">
                  <li><Link to="/">Camera</Link></li>
                  <li><Link to="/help">Help</Link></li>
                  <li><Link to="/debug">Debug</Link></li>
                </ul>
              </div>
              <div className="top-bar-right">
                <Clock lastUpdate={this.state.lastUpdate} warp={this.state.warp} setWarp={this.setWarp} />
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