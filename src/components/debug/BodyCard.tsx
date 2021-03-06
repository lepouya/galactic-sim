import React from 'react';
import Body from '../../model/Body';
import unit from '../../utils/unit';

function fact(title: string, value: string) {
  return (
    <div>
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
      <div className="uk-width-auto@s">
        <div className="uk-card uk-card-default uk-card-body">
          {fact('name', body.name)}
          {fact('position', unit.print(body.position, unit.distance))}
          {fact('velocity', unit.print(body.velocity, unit.speed))}
          {fact('semi-major axis', unit.print(orbit.semiMajorAxis, unit.distance))}
          {fact('eccentricity', unit.print(orbit.eccentricity))}
          {fact('inclination', unit.print(orbit.inclination, unit.angle))}
          {fact('longitude of AN', unit.print(orbit.longitudeOfAscendingNode, unit.angle))}
          {fact('argument of periapsis', unit.print(orbit.argumentOfPeriapsis, unit.angle))}
          {fact('mean anomaly', unit.print(orbit.meanAnomaly, unit.angle))}
          {fact('periapsis', unit.print(orbit.extras.periapsis, unit.distance))}
          {fact('apoapsis', unit.print(orbit.extras.apoapsis, unit.distance))}
          {fact('period', unit.print(orbit.extras.period, unit.time))}
          {fact('SOI', unit.print(body.sphereOfInfluence, unit.distance))}
          {fact('abs pos', unit.print(body.getAbsolutePosition()))}
          {fact('abs axis', unit.print(body.axisAbsolute))}
        </div>
      </div>
    );
  }
}