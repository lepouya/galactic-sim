import * as THREE from 'three';
import Body from '../model/Body';
import World from '../model/World';
import WorldScene from './WorldScene';

export default class BodyMeshes {
  // Main mesh to draw
  public mesh: THREE.Mesh;

  // Center of body to be always visible
  public particle: THREE.Points;

  // Orbit of the body
  public orbit?: THREE.Line;

  // Body's axis
  public axis: THREE.Line;

  // Group of all the meshes to render for this body
  public group: THREE.Group;
  public parentGroup: THREE.Group;

  constructor(
    public body: Body,
  ) {
    const color = (body.mass > 1e29) ? 0xffff00 : (body.mass > 1e24) ? 0x0077ff : (body.mass > 1e10) ? 0xaaaaaa : 0xffffff;

    this.group = new THREE.Group();
    this.parentGroup = new THREE.Group();
    WorldScene.Instance.scene.add(this.group);
    WorldScene.Instance.scene.add(this.parentGroup);

    this.mesh = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({ color }));
    this.mesh.setRotationFromAxisAngle(body.axisNormal, body.axisAngle);
    if ((body.mass > 1e10) || (body.radius > 1e5)) {
      this.mesh.geometry = new THREE.SphereBufferGeometry(body.radius, 64, 64);
    } else {
      this.mesh.geometry = new THREE.BoxBufferGeometry(body.radius, body.radius, body.radius);
    }
    this.group.add(this.mesh);

    this.particle = new THREE.Points(
      new THREE.BufferGeometry()
        .addAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3)),
      new THREE.PointsMaterial({ color, size: 3, sizeAttenuation: false }));
    this.particle.geometry.computeBoundingSphere();
    this.group.add(this.particle);

    this.axis = new THREE.Line(
      new THREE.BufferGeometry()
        .addAttribute('position',
        new THREE.Float32BufferAttribute([0, -body.radius * 1.25, 0, 0, body.radius * 1.75, 0], 3)),
      new THREE.LineBasicMaterial({ color }));
    this.axis.geometry.computeBoundingBox();
    this.axis.setRotationFromAxisAngle(body.axisNormal, body.axisAngle);
    this.group.add(this.axis);

    if (body.validOrbit() && body.parent) {
      const orbitPoints: number[] = [];
      const bodyOrbit = body.orbit.deepCopy(body.parent.mass, body.mass);
      for (let i = -128; i <= 128; i++) {
        bodyOrbit.meanAnomaly = body.orbit.meanAnomaly + i / 128 * Math.PI;
        let [r] = bodyOrbit.toCartesian(body.parent.mass, body.mass);
        orbitPoints.push(r.x, r.y, r.z);
      }

      this.orbit = new THREE.Line(
        new THREE.BufferGeometry()
          .addAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3)),
        new THREE.LineBasicMaterial({ color }));
      this.orbit.geometry.computeBoundingBox();
      this.orbit.setRotationFromAxisAngle(body.parent.axisNormal, body.parent.axisAngle);
      this.parentGroup.add(this.orbit);
    }
  }

  updatePosition() {
    // Update position of everything attached to this object
    this.group.position.copy(this.body.getAbsolutePosition(World.Instance.posCache));

    // Update positions attached to the parent body
    if (this.body.parent) {
      this.parentGroup.position.copy(this.body.parent.getAbsolutePosition(World.Instance.posCache));
    }

    // TODO: get the absolute rotation
    this.mesh.rotation.copy(this.body.rotation);
  }
}