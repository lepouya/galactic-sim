import React from 'react';
import ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import WorldScene from '../graphics/WorldScene';

export default class Main extends React.Component<RouteComponentProps<any>> {
  componentDidMount() {
    const scene = WorldScene.Instance;
    const domNode = ReactDOM.findDOMNode(this);
    scene.resizeWindow();

    if (domNode) {
      domNode.appendChild(scene.renderer.domElement);
    }
  }

  render() {
    return <div />;
  }
}