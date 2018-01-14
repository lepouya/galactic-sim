import React from 'react';

import Spinner from './Spinner';
import Game from './Game';
import bind from '../utils/bind';
import World from '../model/World';
import WorldScene from '../graphics/WorldScene';

interface LoaderState {
  loaded: boolean;
}

export default class Loader extends React.Component<{}, LoaderState> {
  constructor(props: any) {
    super(props);
    this.state = { loaded: false };
  }

  componentWillMount() {
    setTimeout(this.load, 1);
  }

  @bind
  async load() {
    const world = new World(0);
    world.loadFromLocalStorage();
    if (world.children.size == 0) {
      world.load(require('../data/solar_system'));
    }

    new WorldScene();

    this.setState({ loaded: true });
  }

  render() {
    if (this.state.loaded) {
      return <Game />;
    }

    return <Spinner />
  }
}