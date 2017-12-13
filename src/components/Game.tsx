import React from 'react';
import { HashRouter, Link, Route, Switch } from 'react-router-dom';

import Main from '../pages/Main';
import Help from '../pages/Help';

export interface GameProps {
}

export default class Game extends React.Component<GameProps> {
  render() {
    return (
      <HashRouter>
        <div>
          <header>
            <div className="top-bar">
              <div className="top-bar-left">
                <ul className="menu">
                  <li><Link to="/">Galactic Sim</Link></li>
                  <li><Link to="/help">Help</Link></li>
                </ul>
              </div>
            </div>
          </header>
          <main>
            <Switch>
              <Route exact path="/" component={Main} />
              <Route path="/help" component={Help} />
            </Switch>
          </main>
        </div>
      </HashRouter>
    );
  }
}