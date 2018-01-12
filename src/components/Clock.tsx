import React from 'react';
import unit from '../utils/unit';
import World from '../model/World';

const warpPoints = [0, 1 / 4, 1, 2, 5, 15, 60, 5 * 60, 15 * 60, 60 * 60, 4 * 60 * 60, 24 * 60 * 60];

export interface Props {
  lastUpdate: number;
  warp: number;
  setWarp: (warp: number) => void;
}

export default class Clock extends React.Component<Props> {
  render() {
    const warp = this.props.warp;
    const index = warpPoints.indexOf(warp);

    return (
      <div className="grid-container">
        <div className="grid-y">
          <div className="cell">
            {unit.print(World.Instance.lastUpdated, unit.date)}
          </div>
          <div style={{ margin: 0 }} className="cell button-group">
            {warpPoints.map((v, i) =>
              <button
                key={'warp' + i}
                style={{ padding: '0.2rem' }}
                className={(v <= warp ? 'success' : 'secondary') + ' button'}
                onClick={() => this.props.setWarp(v)}
              />
            )}
          </div>
          <div style={{ margin: 0 }} className="cell button-group tiny">
            <button
              className="clock-button"
              onClick={() => this.props.setWarp(warpPoints[Math.max(0, index - 1)])}>
              &#x23EA;
            </button>
            <button
              className="clock-button"
              onClick={() => this.props.setWarp(warp == 1 ? 0 : 1)}>
              &#x23EF;
            </button>
            <button
              className="clock-button"
              onClick={() => this.props.setWarp(warpPoints[Math.min(11, index + 1)])}>
              &#x23e9;
            </button>
            {(warp == 0) ? 'Paused' :
              (warp >= 1) ? (warp.toFixed() + 'x') :
                ('1/' + (1 / warp).toFixed() + 'x')}
          </div>
        </div>
      </div>
    );
  }
}