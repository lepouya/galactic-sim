export type PhaseState = {
  x: number;
  y: number;
  z: number;
  dx: number;
  dy: number;
  dz: number;
};

export type OrbitalElements = {
  a: number;
  e: number;
  i: number;
  o: number;
  w: number;
  m: number;
};

export function keplerian(mu: number, state: PhaseState, orbit: OrbitalElements) {
  /* find direction of angular momentum vector */
  const rxv_x = state.y * state.dz - state.z * state.dy;
  const rxv_y = state.z * state.dx - state.x * state.dz;
  const rxv_z = state.x * state.dy - state.y * state.dx;
  const hs = rxv_x * rxv_x + rxv_y * rxv_y + rxv_z * rxv_z;
  const h = Math.sqrt(hs);

  const r = Math.sqrt(state.x * state.x + state.y * state.y + state.z * state.z);
  const vs = state.dx * state.dx + state.dy * state.dy + state.dz * state.dz;

  const rdotv = state.x * state.dx + state.y * state.dy + state.z * state.dz;
  const rdot = rdotv / r;

  orbit.i = Math.acos(rxv_z / h);

  orbit.o = 0.0;
  if (rxv_x != 0.0 || rxv_y != 0.0) {
    orbit.o = Math.atan2(rxv_x, -rxv_y);
  }

  orbit.a = 1.0 / (2.0 / r - vs / mu);

  const ecostrueanom = hs / (mu * r) - 1.0;
  const esintrueanom = rdot * h / mu;
  orbit.e = Math.sqrt(ecostrueanom * ecostrueanom + esintrueanom * esintrueanom);

  let trueanom = 0.0;
  if (esintrueanom != 0.0 || ecostrueanom != 0.0) {
    trueanom = Math.atan2(esintrueanom, ecostrueanom);
  }

  const cosnode = Math.cos(orbit.o);
  const sinnode = Math.sin(orbit.o);

  /* u is the argument of latitude */
  const rcosu = state.x * cosnode + state.y * sinnode;
  const rsinu = (state.y * cosnode - state.x * sinnode) / Math.cos(orbit.i);

  let u = 0.0
  if (rsinu != 0.0 || rcosu != 0.0) {
    u = Math.atan2(rsinu, rcosu);
  }

  orbit.w = u - trueanom;

  let foo = Math.sqrt(Math.abs(1.0 - orbit.e) / (1.0 + orbit.e));
  if (orbit.e < 1.0) {
    const eccanom = 2.0 * Math.atan(foo * Math.tan(trueanom / 2.0));
    orbit.m = eccanom - orbit.e * Math.sin(eccanom);
    if (orbit.m > Math.PI) orbit.m -= 2.0 * Math.PI;
    if (orbit.m < -Math.PI) orbit.m += 2.0 * Math.PI;
    // only shift M if elliptic orbit
  } else {
    const eccanom = 2.0 * Math.atanh(foo * Math.tan(trueanom / 2.0));
    orbit.m = orbit.e * Math.sinh(eccanom) - eccanom;
  }
  if (orbit.w > Math.PI) orbit.w -= 2.0 * Math.PI;
  if (orbit.w < -Math.PI) orbit.w += 2.0 * Math.PI;
}

export function cartesian(mu: number, state: PhaseState, orbit: OrbitalElements) {
  let a = orbit.a, e = orbit.e, i = orbit.i, longnode = orbit.o, argperi = orbit.w, meananom = orbit.m;
  /* double E1, E2, den; */

  /* compute eccentric anomaly */
  const E0 = (e < 1) ? ecc_ano(e, meananom) : ecc_anohyp(e, meananom);
  let cosE = 0, sinE = 0;

  if (e < 1.0) {
    cosE = Math.cos(E0);
    sinE = Math.sin(E0);
  } else {
    cosE = Math.cosh(E0);
    sinE = Math.sinh(E0);
  }
  a = Math.abs(a);
  const meanmotion = Math.sqrt(mu / (a * a * a));
  const foo = Math.sqrt(Math.abs(1.0 - e * e));
  /* compute unrotated positions and velocities */
  let rovera = (1.0 - e * cosE);
  if (e > 1.0) rovera *= -1.0;
  let x = a * (cosE - e);
  let y = foo * a * sinE;
  let z = 0.0;
  let xd = -a * meanmotion * sinE / rovera;
  let yd = foo * a * meanmotion * cosE / rovera;
  let zd = 0.0;
  if (e > 1.0) x *= -1.0;

  /* rotate by argument of perihelion in orbit plane*/
  const cosw = Math.cos(argperi);
  const sinw = Math.sin(argperi);
  const xp = x * cosw - y * sinw;
  const yp = x * sinw + y * cosw;
  const zp = z;
  const xdp = xd * cosw - yd * sinw;
  const ydp = xd * sinw + yd * cosw;
  const zdp = zd;

  /* rotate by inclination about x axis */
  const cosi = Math.cos(i);
  const sini = Math.sin(i);
  x = xp;
  y = yp * cosi - zp * sini;
  z = yp * sini + zp * cosi;
  xd = xdp;
  yd = ydp * cosi - zdp * sini;
  zd = ydp * sini + zdp * cosi;

  /* rotate by longitude of node about z axis */
  const cosnode = Math.cos(longnode);
  const sinnode = Math.sin(longnode);
  state.x = x * cosnode - y * sinnode;
  state.y = x * sinnode + y * cosnode;
  state.z = z;
  state.dx = xd * cosnode - yd * sinnode;
  state.dy = xd * sinnode + yd * cosnode;
  state.dz = zd;
}

/* ----------------Solve Kepler's equation
 iterate to get an estimate for eccentric anomaly (u) given the mean anomaly (l).
Appears to be accurate to level specified, I checked this 
and it works for u,lambda in all quadrants and at high eccentricity
*/
function ecc_ano(e: number, l: number): number {
  let du = 1.0;
  let u0 = l + e * Math.sin(l) + 0.5 * e * e * Math.sin(2.0 * l);
  // also see M+D equation 2.55
  // supposed to be good to second order in e, from Brouwer+Clemence u0 is first guess
  while (Math.abs(du) > 1e-6) {
    let l0 = u0 - e * Math.sin(u0);
    du = (l - l0) / (1.0 - e * Math.cos(u0));
    u0 += du;  /* this gives a better guess */
    // equation 2.58 from M+D
  }
  return u0;
}

// hyperbolic case 
function ecc_anohyp(e: number, l: number): number {
  let du = 1.0;
  let u0 = Math.log(2.0 * l / e + 1.8); //danby guess
  while (Math.abs(du) > 1e-6) {
    let fh = e * Math.sinh(u0) - u0 - l;
    let dfh = e * Math.cosh(u0) - 1.0;
    du = -fh / dfh;
    u0 += du;
  }
  return u0;
}
