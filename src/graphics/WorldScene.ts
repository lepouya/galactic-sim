import * as THREE from 'three';
import bind from '../utils/bind';
import unit from '../utils/unit';
import Body from '../model/Body';
import World from '../model/World';
import BodyMeshes from './BodyMeshes';

export default class WorldScene {
  static Default = {
    FOV: 75,
    NearPlane: 0.1,
    FarPlane: unit.ly,
  }

  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  public bodyMeshes = new Map<string, BodyMeshes>();

  public focus?: Body;

  public static Instance: WorldScene;

  constructor(
    public world = World.Instance,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: true,
    });

    this.camera = new THREE.PerspectiveCamera(
      WorldScene.Default.FOV,
      window.innerWidth / window.innerHeight,
      WorldScene.Default.NearPlane,
      WorldScene.Default.FarPlane);

    this.scene = new THREE.Scene();

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.resizeWindow();
    this.animate();

    window.addEventListener('resize', this.resizeWindow, false);

    WorldScene.Instance = this;
  }

  @bind
  animate() {
    requestAnimationFrame(this.animate);

    this.world.bodies.forEach((_, body) => this.setBody(body));

    if (this.focus) {
      const focusPoint = this.focus.getAbsolutePosition(this.world.posCache);
      this.camera.position.copy(focusPoint)
        .setLength(focusPoint.length() + this.focus.radius * 50)
        .add(new THREE.Vector3(this.focus.radius, this.focus.radius, this.focus.radius * 40));
      this.camera.lookAt(focusPoint);
      this.camera.updateProjectionMatrix();
    }

    this.renderer.render(this.scene, this.camera);
  }

  @bind
  resizeWindow() {
    let width = window.innerWidth, height = window.innerHeight;

    const navBar = document.getElementById('navBar');
    if (navBar) {
      height -= navBar.clientHeight;
    }

    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  setBody(body: Body) {
    if (!this.bodyMeshes.has(body.id)) {
      this.bodyMeshes.set(body.id, new BodyMeshes(body));
      if (body.id == 'earth') {
        this.focus = body;
      }
    }

    this.bodyMeshes.get(body.id)!.updatePosition();
  }
}
