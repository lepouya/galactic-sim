import { Vector3 } from 'three';

import React from 'react';
import Body from '../../model/Body';
import Orbit from '../../utils/Orbit';

const dists = new Map([[1e+9, 'Gm'], [1e+6, 'Mm'], [1e+3, 'Km'], [1, 'm']]);
const times = new Map([[60 * 60 * 24, 'day'], [60 * 60, 'hr'], [60, 'min'], [1, 's']]);

function findMax(n: number, m: Map<number, string>) {
  let res = 1;
  m.forEach((_, v) => res = Math.max(res, (n >= v) ? v : 1));
  return res;
}

function p_num(n: number) {
  return n.toPrecision(3);
}

function p_dist(n: number) {
  const coef = findMax(Math.abs(n), dists);
  return p_num(n / coef) + dists.get(coef);
}

function p_time(n: number) {
  const coef = findMax(Math.abs(n), times);
  return p_num(n / coef) + times.get(coef);
}

function p_angle(n: number) {
  return p_num(n * Math.PI / 180) + '°';
}

function p_vec(v: Vector3) {
  return `[${p_dist(v.x)}, ${p_dist(v.y)}, ${p_dist(v.z)}]`;
}

function fact(title: string, value: string) {
  return (
    <div className="text-left">
      <b>{title}</b>: {value}
    </div>
  );
}

interface Props {
  body: Body;
}

export default class BodyCard extends React.Component<Props> {
  render() {
    const body = this.props.body;
    const orbit = body.orbit;
    return (
      <div className="cell small-4 callout primary">
        {fact('name', body.name)}
        {fact('position', p_vec(body.position))}
        {fact('velocity', p_vec(body.velocity) + '/s')}
        {fact('abs pos', p_vec(body.getAbsolutePosition()))}
        {fact('semi-major axis', p_dist(orbit.semiMajorAxis))}
        {fact('eccentricity', p_num(orbit.eccentricity))}
        {fact('inclination', p_angle(orbit.inclination))}
        {fact('longitude of AN', p_angle(orbit.longitudeOfAscendingNode))}
        {fact('argument of periapsis', p_angle(orbit.argumentOfPeriapsis))}
        {fact('mean anomaly', p_angle(orbit.meanAnomaly))}
        {fact('periapsis', p_dist(orbit.extras.periapsis))}
        {fact('apoapsis', p_dist(orbit.extras.apoapsis))}
        {fact('period', p_time(orbit.extras.period))}
      </div>
    );
  }
}