import React from 'react';
import ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import World from '../model/World';

export default class Main extends React.Component<RouteComponentProps<any>> {
  componentDidMount() {
    World.Instance.resizeWindow();
    ReactDOM.findDOMNode(this).appendChild(World.Instance.renderer.domElement);
  }

  render() {
    return <div />;
  }
}