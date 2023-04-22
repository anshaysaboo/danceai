import * as poseDetection from "@tensorflow-models/pose-detection";

const model = poseDetection.SupportedModels.BlazePose;
const detectorConfig = {
  runtime: "mediapipe",
  solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/pose`, //${mpPose.VERSION}
  modelType: "full",
  enableSmoothing: true,
};

export default async function createDetector() {
  const detector = await poseDetection.createDetector(model, detectorConfig);
  return detector;
}
