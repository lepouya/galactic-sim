import React from 'react';
import ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import WorldScene from '../graphics/WorldScene';

export default class Main extends React.Component<RouteComponentProps<any>> {
  componentDidMount() {
    const scene = WorldScene.Instance;
    scene.resizeWindow();
    ReactDOM.findDOMNode(this).appendChild(scene.renderer.domElement);
  }

  render() {
    return <div />;
  }
}