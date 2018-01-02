import React from 'react';
import { RouteComponentProps } from 'react-router';

import World from '../model/World';
import BodyCard from '../components/debug/BodyCard';

export default class Debug extends React.Component<RouteComponentProps<any>> {
  render() {
    const bodies = Array.from(World.Instance.getAllChildren());

    return (
      <div className="grid-container">
        <p className="text-center">World clock: {World.Instance.lastUpdated.toPrecision(3)}</p>
        <div className="grid-x grid-margin-x grid-margin-y">
          {bodies.map(body => <BodyCard body={body} />)}
        </div>
      </div>
    );
  }
}