import * as THREE from 'three';
import { Vector3 } from 'three';
import Body from './Body';
import approximately from '../utils/approximately';
import bind from '../utils/bind';

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

    FOV: 75,
    NearPlane: 0.1,
    FarPlane: 1000,
  }

  constructor(
    public lastUpdated: number = Date.now() / 1000,
  ) { }

  static Instance = new World();

  // ---------------
  // Physics section
  // ---------------

  public readonly children = new Set<Body>();

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
    const bodies = this.getAllChildren();

    // Figure out which children can use predictOrbit
    bodies.forEach((simLevel, body) => {
      if (simLevel == Body.SimulationLevel.OrbitalPrediction) {
        body.predictOrbit(now, posCache);
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
      bodies.forEach((simLevel, body) => {
        if (simLevel != Body.SimulationLevel.OrbitalPrediction) {
          body.simulate(time, simLevel, posCache);
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

  // ----------------
  // Graphics section
  // ----------------

  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.Renderer;

  initRenderer() {
    if (this.scene || this.camera || this.renderer) {
      return;
    }

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      World.Default.FOV,
      window.innerWidth / window.innerHeight,
      World.Default.NearPlane,
      World.Default.FarPlane);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    window.addEventListener('resize', this.onWindowResize, false);

    let geometry = new THREE.BoxGeometry(1, 1, 1);
    let material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    let cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);
    this.camera.position.z = 5;

    const _this = this;
    let animate = function () {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.1;
      cube.rotation.y += 0.1;
      _this.renderer.render(_this.scene, _this.camera);
    };
    animate();
  }

  @bind
  onWindowResize() {
    let width = window.innerWidth, height = window.innerHeight;

    const navBar = document.getElementById("navBar");
    if (navBar) {
      height -= navBar.clientHeight;
    }

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}