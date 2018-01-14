import * as THREE from 'three';
import bind from '../utils/bind';
import unit from '../utils/unit';
import Body from '../model/Body';
import World from '../model/World';

export default class WorldScene {
  static Default = {
    FOV: 75,
    NearPlane: 0.1,
    FarPlane: unit.ly,
  }

  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

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
        .setLength(focusPoint.length() + this.focus.radius * 75)
        .addScalar(this.focus.radius);
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
    if (!body.mesh) {
      const mesh = new THREE.Mesh();
      body.mesh = mesh;
      mesh.name = body.name;
      this.scene.add(mesh);

      if ((body.mass > 1e10) || (body.radius > 1e5)) {
        mesh.geometry = new THREE.SphereBufferGeometry(body.radius, 64, 64);
      } else {
        mesh.geometry = new THREE.BoxBufferGeometry(body.radius, body.radius, body.radius);
      }

      const color = (body.mass > 1e29) ? 0xffff00 : (body.mass > 1e24) ? 0x0077ff : (body.mass > 1e10) ? 0xaaaaaa : 0xffffff;
      mesh.material = new THREE.MeshBasicMaterial({ color });

      if (body.id == 'earth') {
        this.focus = body;
      }
    }

    body.mesh.position.copy(body.getAbsolutePosition(this.world.posCache));
    // TODO: get the absolute rotation
    body.mesh.rotation.copy(body.rotation);
  }
}
