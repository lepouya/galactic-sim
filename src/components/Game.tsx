import React from 'react';
import { HashRouter, NavLink, Route, Switch } from 'react-router-dom';
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
          <nav className="uk-navbar-container" uk-navbar="">
            <div className="uk-navbar-left">
              <ul className="uk-navbar-nav">
                <li><NavLink activeClassName="uk-active" exact to="/">Camera</NavLink></li>
                <li><NavLink activeClassName="uk-active" to="/help">Help</NavLink></li>
                <li><NavLink activeClassName="uk-active" to="/debug">Debug</NavLink></li>
              </ul>
            </div>
            <div className="uk-navbar-right">
              <ul className="uk-navbar-nav">
                <Clock lastUpdate={this.state.lastUpdate} warp={this.state.warp} setWarp={this.setWarp} />
              </ul>
            </div>
          </nav>
          <Switch>
            <Route exact path="/" component={Main} />
            <Route path="/help" component={Help} />
            <Route path="/debug" component={Debug} />
          </Switch>
        </div>
      </HashRouter>
    );
  }
}