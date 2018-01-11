import React from 'react';
import { RouteComponentProps } from 'react-router';

import World from '../model/World';
import BodyCard from '../components/debug/BodyCard';
import unit from '../utils/unit';

export default class Debug extends React.Component<RouteComponentProps<any>> {
  render() {
    const bodies = Array.from(World.Instance.getAllChildren().keys());

    return (
      <div className="grid-container">
        <p className="text-center">
          World clock: {unit.print(World.Instance.lastUpdated, unit.date)}
        </p>
        <div className="grid-x grid-margin-x grid-margin-y">
          {bodies.map(body => <BodyCard body={body} key={body.id} />)}
        </div>
      </div>
    );
  }
}