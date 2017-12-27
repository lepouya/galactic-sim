// Kepler equation and stepping methods

const pi = Math.PI, epsilon = 1e-8, nLaguerre = 5, G = 6.67408e-11;
const sqrt = Math.sqrt, cbrt = (x: number) => Math.exp(Math.log(x) / 3);
const abs = Math.abs, sign = Math.sign;
const sin = Math.sin, cos = Math.cos, atan2 = Math.atan2;
const cosh = Math.cosh, sinh = Math.sinh, asinh = Math.asinh;

// solving kepler's equation including the 
// hyperbolic case, code downloaded from project pluto
export function kepler(eccentricity: number, meanAnomaly: number): number {
  let curr: number, err: number, thresh: number;
  let isNeg = 0;

  if (!meanAnomaly)
    return 0;

  if (eccentricity < .3) { // low-eccentricity formula from Meeus,  p. 195
    curr = atan2(sin(meanAnomaly), cos(meanAnomaly) - eccentricity);
    // one correction step,  and we're done
    err = curr - eccentricity * sin(curr) - meanAnomaly;
    curr -= err / (1 - eccentricity * cos(curr));
    return (curr);
  }

  if (meanAnomaly < 0) {
    meanAnomaly = -meanAnomaly;
    isNeg = 1;
  }

  curr = meanAnomaly;
  thresh = epsilon * abs(1 - eccentricity);
  if (eccentricity > .8 && meanAnomaly < pi / 3 || eccentricity > 1) { // up to 60 degrees
    let trial = meanAnomaly / abs(1 - eccentricity);

    if (trial * trial > 6 * abs(1 - eccentricity)) { // cubic term is dominant
      if (meanAnomaly < pi)
        trial = cbrt(6 * meanAnomaly);
      else // hyperbolic w/ 5th & higher-order terms predominant
        trial = asinh(meanAnomaly / eccentricity);
    }
    curr = trial;
  }

  if (eccentricity < 1) {
    err = curr - eccentricity * sin(curr) - meanAnomaly;
    while (abs(err) > thresh) {
      curr -= err / (1 - eccentricity * cos(curr));
      err = curr - eccentricity * sin(curr) - meanAnomaly;
    }
  }
  else {
    err = eccentricity * sinh(curr) - curr - meanAnomaly;
    while (abs(err) > thresh) {
      curr -= err / (eccentricity * cosh(curr) - 1);
      err = eccentricity * sinh(curr) - curr - meanAnomaly;
    }
  }
  return (isNeg ? -curr : curr);
}


// given M1,x,y,z, vx,vy,vz, calculate new position and velocity at time t later
// using f and g functions and formulae from Prussing + conway
export default function keplerStep(
  dt: number, m1: number, m2: number,
  x: number, y: number, z: number,
  vx: number, vy: number, vz: number
): [
    number, number, number,
    number, number, number
  ] {
  let newX = x, newY = y, newZ = z;
  let newVX = vx, newVY = vy, newVZ = vz;
  const mu = G * (m1 + m2); // gravitational parameter
  const r0 = sqrt(x * x + y * y + z * z); // current radius
  const v2 = (vx * vx + vy * vy + vz * vz);  // current velocity
  const r0_dot_v0 = (x * vx + y * vy + z * vz);
  const alpha = (2 / r0 - v2 / mu);  // inverse of semi-major eqn 2.134 MD
  // here alpha=1/a and can be negative
  const x_p = solve_x(r0_dot_v0, alpha, mu, r0, dt); // solve universal kepler eqn
  const smu = sqrt(mu);
  const foo = 1 - r0 * alpha;
  const sig0 = r0_dot_v0 / smu;

  const x2 = x_p * x_p;
  const x3 = x2 * x_p;
  const alx2 = alpha * x2;
  const Cp = C_Prussing(alx2);
  const Sp = S_Prussing(alx2);
  const r = sig0 * x_p * (1 - alx2 * Sp) + foo * x2 * Cp + r0; // eqn 2.42  PC
  // f,g functions equation 2.38a  PC
  const f_p = 1 - (x2 / r0) * Cp;
  const g_p = dt - (x3 / smu) * Sp;
  // df_dt, dg_dt function equation 2.38b PC
  const df_dt = x_p * smu / (r * r0) * (alx2 * Sp - 1);
  const dg_dt = 1 - (x2 / r) * Cp;

  if (r0 > 0) { // error catch if a particle is at Sun
    newX = x * f_p + g_p * vx; // eqn 2.65 M+D
    newY = y * f_p + g_p * vy;
    newZ = z * f_p + g_p * vz;

    newVX = df_dt * x + dg_dt * vx; //eqn 2.70 M+D
    newVY = df_dt * y + dg_dt * vy;
    newVZ = df_dt * z + dg_dt * vz;
  }

  return [
    newX, newY, newZ,
    newVX, newVY, newVZ,
  ];
}

// use Laguerre method as outlined by Prussing + Conway eqn 2.43
// return x universal variable  
// solving differential Kepler's equation
// in universal variable
function solve_x(r0_dot_v0: number, alpha: number,
  mu: number, r0: number, dt: number): number {
  const smu = sqrt(mu);
  const foo = 1 - r0 * alpha;
  const sig0 = r0_dot_v0 / smu;
  let x = mu * dt * dt / r0; // initial guess could be improved 

  let u = 1;
  for (let i = 0; i < 7; i++) { // while(abs(u) > EPS){
    const x2 = x * x;
    const x3 = x2 * x;
    const alx2 = alpha * x2;
    const Cp = C_Prussing(alx2);
    const Sp = S_Prussing(alx2);
    const F = sig0 * x2 * Cp + foo * x3 * Sp + r0 * x - smu * dt; // eqn 2.41 PC
    const dF = sig0 * x * (1 - alx2 * Sp) + foo * x2 * Cp + r0; // eqn 2.42 PC
    const ddF = sig0 * (1 - alx2 * Cp) + foo * x * (1 - alx2 * Sp);
    let z = abs((nLaguerre - 1) * ((nLaguerre - 1) * dF * dF - nLaguerre * F * ddF));
    z = sqrt(z);
    u = nLaguerre * F / (dF + sign(dF) * z); // equation 2.43 PC
    x -= u;
  }
  return x;
}

// equation 2.40a Prussing + Conway
function C_Prussing(y: number): number {
  if (abs(y) < 1e-4) return 1 / 2 * (1 - y / 12 * (1 - y / 30 * (1 - y / 56)));
  const u = sqrt(abs(y));
  if (y > 0) return (1 - cos(u)) / y;
  else return (cosh(u) - 1) / -y;
}

// equation 2.40b Prussing +Conway
function S_Prussing(y: number): number {
  if (abs(y) < 1e-4) return 1 / 6 * (1 - y / 20 * (1 - y / 42 * (1 - y / 72)));
  const u = sqrt(abs(y));
  const u3 = u * u * u;
  if (y > 0) return (u - sin(u)) / u3;
  else return (sinh(u) - u) / u3;
}