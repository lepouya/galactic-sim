import React from 'react';
import Body from '../../model/Body';
import unit from '../../utils/unit';

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
        {fact('position', unit.print(body.position, unit.distance))}
        {fact('velocity', unit.print(body.velocity, unit.speed))}
        {fact('abs pos', unit.print(body.getAbsolutePosition()))}
        {fact('semi-major axis', unit.print(orbit.semiMajorAxis, unit.distance))}
        {fact('eccentricity', unit.print(orbit.eccentricity))}
        {fact('inclination', unit.print(orbit.inclination, unit.angle))}
        {fact('longitude of AN', unit.print(orbit.longitudeOfAscendingNode, unit.angle))}
        {fact('argument of periapsis', unit.print(orbit.argumentOfPeriapsis, unit.angle))}
        {fact('mean anomaly', unit.print(orbit.meanAnomaly, unit.angle))}
        {fact('periapsis', unit.print(orbit.extras.periapsis, unit.distance))}
        {fact('apoapsis', unit.print(orbit.extras.apoapsis, unit.distance))}
        {fact('period', unit.print(orbit.extras.period, unit.time))}
      </div>
    );
  }
}