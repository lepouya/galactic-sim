import { Vector3 } from 'three';
import Body from './Body';
import approximately from '../utils/approximately';

function _storageAvailable() {
  const storage = window.localStorage;
  const x = '__storage_test__';

  if (!storage) {
    return false;
  }

  try {
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;

  } catch (e) {
    return (e instanceof DOMException) &&
      // acknowledge QuotaExceededError only if there's something already stored
      (storage.length !== 0) && (
        // everything except Firefox
        e.code === 22 ||
        // Firefox
        e.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        e.name === 'QuotaExceededError' ||
        // Firefox
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED');
  }
};

export default class World {
  static Default = {
    SimLevel: Body.SimulationLevel.TwoBody,
    TickDelta: 0.1,
    MaxTicks: 1000,
  }

  public static Instance: World;

  constructor(
    public lastUpdated: number = Date.now() / 1000,
  ) {
    World.Instance = this;
  }

  public readonly children = new Set<Body>();
  readonly posCache = new Map<string, Vector3>();
  bodies = this.getAllChildren();

  getAllChildren(map = new Map<Body, number>(), children = this.children) {
    children.forEach(body => {
      map.set(body, body.calculateSimulationLevel());
      this.getAllChildren(map, body.children);
    })
    return map;
  }

  simulate(
    now = Date.now() / 1000,
    tickDelta = World.Default.TickDelta,
    maxTicks = World.Default.MaxTicks,
  ) {
    // Find the delta-t and whether it's been long enough to simulate
    const dt = now - this.lastUpdated;
    if (approximately.zero(dt)) {
      return;
    }
    const startTime = this.lastUpdated;
    this.lastUpdated = now;

    // Find all the bodies to simulate
    this.bodies = this.getAllChildren();

    // Figure out which children can use predictOrbit
    this.bodies.forEach((simLevel, body) => {
      if (simLevel == Body.SimulationLevel.OrbitalPrediction) {
        body.predictOrbit(now, this.posCache);
      }
    })

    // Find out the actual tickDelta
    if (Math.abs(dt) < tickDelta) {
      tickDelta = dt;
    } else if (Math.abs(dt / maxTicks) > tickDelta) {
      tickDelta = dt / maxTicks;
    } else {
      tickDelta *= Math.sign(dt);
    }

    for (let time = startTime; time <= now; time += tickDelta) {
      this.bodies.forEach((simLevel, body) => {
        if (simLevel != Body.SimulationLevel.OrbitalPrediction) {
          body.simulate(time, simLevel, this.posCache);
        }
      });
    }
  }

  save(): any {
    return {
      updated: this.lastUpdated,
      bodies: [].concat.apply([], Array.from(this.children).map(b => b.saveAll())),
    };
  }

  saveToString() {
    return btoa(JSON.stringify(this.save()));
  }

  saveToLocalStorage() {
    const saveVal = this.saveToString();
    if (_storageAvailable() && saveVal) {
      localStorage.setItem('World', saveVal);
    }
  }

  load(data: any) {
    if (data.data) {
      data = data.data;
    }

    this.lastUpdated = data.updated || 0;

    const bodies = new Map<string, Body>();
    for (let bodyData of (data.bodies || [])) {
      const body = Body.loadNew(bodyData);
      bodies.set(body.id, body);
      if (bodyData.parent) {
        body.parent = bodies.get(bodyData.parent);
        body.load(bodyData);
      } else {
        this.children.add(body);
      }
    }

    return this;
  }

  loadFromString(data: string) {
    return this.load(JSON.parse(atob(data)));
  }

  loadFromLocalStorage() {
    if (_storageAvailable()) {
      const saveVal = localStorage.getItem('World');
      if (saveVal) {
        try {
          this.loadFromString(saveVal);
        } catch (_) { }
      }
    }
    return this;
  }
}