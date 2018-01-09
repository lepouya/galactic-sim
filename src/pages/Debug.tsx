import React from 'react';
import { RouteComponentProps } from 'react-router';

import World from '../model/World';
import BodyCard from '../components/debug/BodyCard';
import unit from '../utils/unit';
import bind from '../utils/bind';

export default class Debug extends React.Component<RouteComponentProps<any>> {
  @bind
  save() {
    console.log(World.Instance.save());
    console.log(World.Instance.saveToString());
  }

  render() {
    const bodies = Array.from(World.Instance.getAllChildren());

    return (
      <div className="grid-container">
        <p className="text-center">
          World clock: {unit.print(World.Instance.lastUpdated, unit.time)}
        </p>
        <p className="text-right">
          <button onClick={this.save}>Save to Console</button>
        </p>
        <div className="grid-x grid-margin-x grid-margin-y">
          {bodies.map(body => <BodyCard body={body} key={body.id} />)}
        </div>
      </div>
    );
  }
}