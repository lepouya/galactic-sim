export const data = {
  "bodies": [
    {
      "id": "sun",
      "name": "Sun",
      "mass": 1.989e+30,
      "radius": 6.957e+8
    },
    {
      "id": "earth",
      "name": "Earth",
      "parent": "sun",
      "mass": 5.972e+24,
      "radius": 6.371e+6,
      "axis": [0, Math.cos(23.4 * Math.PI / 180), -Math.sin(23.4 * Math.PI / 180)],
      "orbit": {
        "semiMajorAxis": 1.496e+11,
        "eccentricity": 0.0167,
        "inclination": 0,
        "longitudeOfAscendingNode": -0.196,
        "argumentOfPeriapsis": 1.7965,
        "meanAnomaly": 0
      }
    },
    {
      "id": "moon",
      "name": "Moon",
      "parent": "earth",
      "mass": 7.347e+22,
      "radius": 1.737e+6,
      "axis": [0, Math.cos(24.94 * Math.PI / 180), Math.sin(24.94 * Math.PI / 180)],
      "orbit": {
        "semiMajorAxis": 3.844e+8,
        "eccentricity": 0.05496,
        "inclination": 0.31904619,
        "longitudeOfAscendingNode": 3.14159,//2.1831,
        "argumentOfPeriapsis": 5.5528,
        "meanAnomaly": 0
      }
    },
    {
      "id": "iss",
      "name": "ISS",
      "parent": "earth",
      "mass": 4.196e+5,
      "radius": 54.5,
      "orbit": {
        "semiMajorAxis": 6.731e+6,
        "eccentricity": 0,
        "inclination": 0.901,
        "longitudeOfAscendingNode": 2.23,
        "argumentOfPeriapsis": 5.691,
        "meanAnomaly": 3.142
      }
    }
  ]
}