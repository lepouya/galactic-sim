import React from 'react';
import unit from '../utils/unit';
import World from '../model/World';

const warpPoints = [0, 1 / 4, 1, 2, 5, 15, 60, 5 * 60, 15 * 60, 60 * 60, 4 * 60 * 60, 24 * 60 * 60];

interface Props {
  lastUpdate: number;
  warp: number;
  setWarp: (warp: number) => void;
}

export default class Clock extends React.Component<Props> {
  private fps = 0;
  private frameCount = 0;
  private startTime = Date.now();

  calculateFPS() {
    const dt = (this.props.lastUpdate - this.startTime) / 1000;

    this.frameCount++;

    if (dt >= 1) {
      this.fps = this.frameCount / dt;
      this.frameCount = 0;
      this.startTime = this.props.lastUpdate;
    } else if ((this.frameCount == 1) && (this.fps == 0)) {
      this.fps = Math.abs(1 / dt);
    }
  }

  render() {
    this.calculateFPS();
    const warp = this.props.warp;
    const index = warpPoints.indexOf(warp);
    const speedState = (this.fps < 10) ? 'uk-button-danger' : 'uk-button-primary';

    return (
      <div className="uk-grid-collapse uk-child-width-1-1 uk-width-small" uk-grid="">
        <div>
          {unit.print(World.Instance.lastUpdated, unit.date)}
        </div>
        <div className="uk-button-group">
          {warpPoints.map((v, i) =>
            <button
              key={'warp' + i}
              style={{ padding: '0.2rem' }}
              className={((v <= warp) ? speedState : 'uk-button-default') + ' uk-button'}
              onClick={() => this.props.setWarp(v)}
            />
          )}
        </div>
        <div className="uk-button-group">
          <button
            className="clock-button uk-button uk-button-text uk-button-small"
            onClick={() => this.props.setWarp(warpPoints[Math.max(0, index - 1)])}>
            &#x23EA;
          </button>
          <button
            className="clock-button uk-button uk-button-text uk-button-small"
            onClick={() => this.props.setWarp(warp == 1 ? 0 : 1)}>
            &#x23EF;
          </button>
          <button
            className="clock-button uk-button uk-button-text uk-button-small"
            onClick={() => this.props.setWarp(warpPoints[Math.min(11, index + 1)])}>
            &#x23e9;
          </button>
          <div className="uk-text-small uk-text-bottom">
            {(warp == 0) ? 'Paused' :
              (warp >= 1) ? (warp.toFixed() + 'x') :
                ('1/' + (1 / warp).toFixed() + 'x')}
          </div>
        </div>
      </div>
    );
  }
}