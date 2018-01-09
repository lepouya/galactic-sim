import React from 'react';

import Spinner from './Spinner';
import Game from './Game';
import bind from '../utils/bind';
import World from '../model/World';

interface LoaderState {
  loaded: boolean;
}

export default class Loader extends React.Component<{}, LoaderState> {
  constructor(props: any) {
    super(props);
    this.state = { loaded: false };
  }

  componentWillMount() {
    setTimeout(this.load, 1000);
  }

  @bind
  async load() {
    const world = World.Instance;

    world.loadFromLocalStorage();
    if (world.children.size == 0) {
      world.load(require('../data/solar_system'));
    }

    this.setState({ loaded: true });
  }

  render() {
    if (this.state.loaded) {
      return <Game />;
    }

    return <Spinner />
  }
}