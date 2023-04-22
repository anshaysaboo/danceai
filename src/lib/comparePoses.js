//GLOBAL VARIABLES
let subVectorKeypoints = [
  ["wrist", "elbow"],
  ["elbow", "shoulder"],
  ["shoulder", "hip"],
  ["hip", "knee"],
  ["knee", "ankle"],
];
let scoreThreshold = 0.8;
let differencePercentThreshold = 0.01;
let angleDegreeToHue = 2;

function dotProduct(v1, v2) {
  //helper
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

function getMagnitude(v) {
  //helper
  return Math.pow(Math.pow(v.x, 2) + Math.pow(v.y, 2) + Math.pow(v.z, 2), 0.5);
}

function getAngleBetweenVectors(v1, v2) {
  //helper
  let numerator = dotProduct(v1, v2);
  let denominator = getMagnitude(v1) * getMagnitude(v2);
  if (
    Math.abs(numerator - denominator) /
      Math.min(Math.abs(numerator), denominator) <
    differencePercentThreshold
  ) {
    return 0; // same numerator and denominator (so v1 and v2 are same vector)
  }
  return Math.acos(numerator / denominator) * (180 / Math.PI);
}

function extractKeypoints3D(data) {
  //helper
  return data[0].keypoints3D;
}

function createSubVector(keyPoint1, keyPoint2) {
  //helper
  var vector = {
    x: keyPoint2.x - keyPoint1.x,
    y: keyPoint2.y - keyPoint1.y,
    z: keyPoint2.z - keyPoint1.z,
    score: Math.min(keyPoint1.score, keyPoint2.score),
  };
  return vector;
}

export function getAngles(liveData, referenceData) {
  //returns angles of liveData relative to referenceData in form of side, point1, point2: angle, color -> ex for perfect no angle which will be green: left shoulder elbow: 0, [120, 100, 50]
  let angles = {};
  let liveDataDict = extractKeypoints3D(liveData).reduce(function (
    map,
    keypoint
  ) {
    map[keypoint.name] = keypoint;
    return map;
  },
  {});
  let referenceDataDict = extractKeypoints3D(referenceData).reduce(function (
    map,
    keypoint
  ) {
    map[keypoint.name] = keypoint;
    return map;
  },
  {});
  let leftRightPrepends = ["left", "right"];
  for (let i = 0; i < subVectorKeypoints.length; i++) {
    for (let j = 0; j < leftRightPrepends.length; j++) {
      let keyPoint1Name = leftRightPrepends[j] + "_" + subVectorKeypoints[i][0];
      let keyPoint2Name = leftRightPrepends[j] + "_" + subVectorKeypoints[i][1];
      let liveVector = createSubVector(
        liveDataDict[keyPoint1Name],
        liveDataDict[keyPoint2Name]
      );
      let referenceVector = createSubVector(
        referenceDataDict[keyPoint1Name],
        referenceDataDict[keyPoint2Name]
      );
      let anglesName =
        leftRightPrepends[(1 + j) % 2] +
        " " +
        subVectorKeypoints[i][0] +
        " " +
        subVectorKeypoints[i][1]; //have to flip left and right
      if (
        liveVector.score > scoreThreshold &&
        referenceVector.score > scoreThreshold
      ) {
        let angle = getAngleBetweenVectors(liveVector, referenceVector);
        angles[anglesName] = [angle, getColorForAngleDifference(angle)];
      } else {
        angles[anglesName] = [null, null]; // for when the score (confidence) is too low
      }
    }
  }
  return angles;
}

function getColorForAngleDifference(angle) {
  //returns color of vector in HSL
  const H = Math.max(120 - angle * angleDegreeToHue, 0); //basically yellow if 30 degrees off red if 60 degrees off
  const S = 100;
  const L = 50;
  return [H, S, L];
}
