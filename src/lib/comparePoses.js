import { SCORE_VALIDITY_THRESHOLD } from "./config";

//GLOBAL VARIABLES
let subVectorKeypointsSameSide = [
  ["wrist", "elbow"],
  ["elbow", "shoulder"],
  ["shoulder", "hip"],
  ["hip", "knee"],
  ["knee", "ankle"],
];
let subVectorKeypointsOppositeSide = [
  ["shoulder", "shoulder"],
  ["hip", "hip"], // hooray
];
let scoreThreshold = SCORE_VALIDITY_THRESHOLD;
let differencePercentThreshold = 0.01;
let angleDegreeToHue = 1;
let exponentialMultiplier = 3;

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
  const liveDataDict = extractKeypoints3D(liveData).reduce(function (
    map,
    keypoint
  ) {
    map[keypoint.name] = keypoint;
    return map;
  },
  {});
  const referenceDataDict = extractKeypoints3D(referenceData).reduce(function (
    map,
    keypoint
  ) {
    map[keypoint.name] = keypoint;
    return map;
  },
  {});
  const leftRightPrepends = ["left", "right"];
  let allKeypoints = [
    subVectorKeypointsOppositeSide,
    subVectorKeypointsSameSide,
  ];
  for (let z = 0; z < allKeypoints.length; z++) {
    let subVectorKeypoints = allKeypoints[z];
    for (let i = 0; i < subVectorKeypoints.length; i++) {
      let numOfSides = 2; //if same side (left, left), (right, right)
      if (z == 0) {
        //we are going through opposite side keypoints only (left, right)
        numOfSides = 1;
      }
      for (let j = 0; j < numOfSides; j++) {
        let side1 = leftRightPrepends[j];
        let side2 = leftRightPrepends[j];
        if (z == 0) {
          //opposite side keypoints
          side2 = leftRightPrepends[(1 + j) % 2];
        }
        let keyPoint1Name = side1 + "_" + subVectorKeypoints[i][0];
        let keyPoint2Name = side2 + "_" + subVectorKeypoints[i][1];
        let liveVector = createSubVector(
          liveDataDict[keyPoint1Name],
          liveDataDict[keyPoint2Name]
        );
        let referenceVector = createSubVector(
          referenceDataDict[keyPoint1Name],
          referenceDataDict[keyPoint2Name]
        );
        let flippedSideName = leftRightPrepends[(1 + j) % 2] + "_"; //flips left to right and right to left
        let anglesName =
          flippedSideName +
          subVectorKeypoints[i][0] +
          "-" +
          flippedSideName +
          subVectorKeypoints[i][1];
        if (z == 0) {
          anglesName =
            side1 +
            "_" +
            subVectorKeypoints[i][0] +
            "-" +
            side2 +
            "_" +
            subVectorKeypoints[i][1];
        }
        if (
          liveVector.score > scoreThreshold &&
          referenceVector.score > scoreThreshold
        ) {
          let angle = getAngleBetweenVectors(liveVector, referenceVector);
          angles[anglesName] = angle;
        } else {
          angles[anglesName] = null; // for when the score (confidence) is too low
        }
      }
    }
  }
  return angles;
}

export function getColorForAngleDifference(angle) {
  //returns color of vector in HSL
  const H = Math.max(120 - angle * angleDegreeToHue, 0);
  const S = 100;
  const L = 50;
  return [H, S, L];
}

export function getScore(angles) {
  let totScore = 0;
  let totWeights = 0;
  const anglesKeys = Object.keys(angles);
  const weightless = new Set([
    "left_shoulder-right_shoulder",
    "left_shoulder-left_hip",
    "right_shoulder-right_hip",
    "left_hip-right_hip",
  ]);
  //returns scores of angles in form of side, point1, point2: score, color -> ex for perfect no angle which will be green: left shoulder elbow: 1, [120, 100, 50]
  for (let i = 0; i < anglesKeys.length; i++) {
    let angle = angles[anglesKeys[i]];
    if (angle != null) {
      let score = 0;
      if (angle > 35) {
        //punish larger angles
        score = getExponentionalScore(angle);
      } else {
        score = getLinearScore(angle);
      }
      if (weightless.has(anglesKeys[i])) {
        totScore += 0.2 * score;
        totWeights += 0.2;
      } else {
        totScore += score;
        totWeights += 1;
      }
    }
  }
  return totScore / totWeights;
}

function getExponentionalScore(angle) {
  //helper
  return (
    Math.exp((180 - exponentialMultiplier * Math.abs(angle)) / 180) / Math.E
  ); //between 0 and 1
}

function getLinearScore(angle) {
  //helper
  return (180 - Math.abs(angle)) / 180; //between 0 and 1
}
