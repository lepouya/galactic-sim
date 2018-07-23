import React from 'react';
import { RouteComponentProps } from 'react-router';

import World from '../model/World';
import BodyCard from '../components/debug/BodyCard';

export default class Debug extends React.Component<RouteComponentProps<any>> {
  render() {
    const bodies = Array.from(World.Instance.getAllChildren().keys());

    return (
      <div className="uk-child-width-1-3@s uk-grid-match uk-flex uk-flex-left uk-text-left" uk-grid="">
        {bodies.map(body => <BodyCard body={body} key={body.id} />)}
      </div>
    );
  }
}