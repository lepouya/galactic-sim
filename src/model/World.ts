import { Vector3 } from 'three';

import Body from './Body';
import approximately from '../utils/approximately';

export default class World {
  static Default = {
    SimLevel: Body.SimulationLevel.TwoBody,
    TickDelta: 0.1,
    MaxTicks: 1000,
  }

  public readonly children = new Set<Body>();

  constructor(
    public lastUpdated: number = Date.now() / 1000.0,
  ) { }

  private _addAll(set: Set<Body>, children: Set<Body>) {
    children.forEach(body => {
      set.add(body);
      this._addAll(set, body.children);
    })
    return set;
  }

  simulate(
    now = Date.now() / 1000.0,
    simLevel = World.Default.SimLevel,
    tickDelta = World.Default.TickDelta,
    maxTicks = World.Default.MaxTicks,
    posCache?: Map<string, Vector3>,
  ) {
    // Find the delta-t and whether it's been long enough to simulate
    const dt = now - this.lastUpdated;
    if (approximately.zero(dt)) {
      return;
    }
    const startTime = this.lastUpdated;
    this.lastUpdated = now;

    // Local position cache
    if (!posCache) {
      posCache = new Map<string, Vector3>();
    }

    // Find all the bodies to simulate
    const bodies = this._addAll(new Set<Body>(), this.children);

    // TODO: Figure out which children can use predictOrbit

    // Find out the actual tickDelta
    if (Math.abs(dt) < tickDelta) {
      tickDelta = dt;
    } else if (Math.abs(dt / maxTicks) > tickDelta) {
      tickDelta = dt / maxTicks;
    } else {
      tickDelta *= Math.sign(dt);
    }

    for (let time = startTime; time <= now; time += tickDelta) {
      bodies.forEach(body => body.simulate(time, simLevel, posCache));
    }
  }

  static Instance = new World();
}