import React from 'react';

import Spinner from './Spinner';
import Game from './Game';

interface LoaderState {
  loaded: boolean;
}

export default class Loader extends React.Component<{}, LoaderState> {
  constructor(props: any) {
    super(props);
    this.state = { loaded: false };
    this.load = this.load.bind(this);
  }

  componentWillMount() {
    setTimeout(this.load, 1000);
  }

  async load() {
    this.setState({ loaded: true });
  }

  render() {
    if (this.state.loaded) {
      return <Game />;
    }

    return <Spinner />
  }
}