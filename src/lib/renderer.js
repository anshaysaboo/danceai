import { getColorForAngleDifference } from "./comparePoses";
import { SCORE_VALIDITY_THRESHOLD } from "./config";

const THRESHOLD = SCORE_VALIDITY_THRESHOLD;

const EXCLUDED_POINTS = new Set([
  "nose",
  "left_eye_inner",
  "left_eye",
  "left_eye_outer",
  "right_eye_inner",
  "right_eye",
  "right_eye_outer",
  "left_ear",
  "right_ear",
  "mouth_left",
  "mouth_right",
]);

export function drawPose(ctx, keypoints, keypoints3d, skeleton, angles) {
  if (!canvas || !keypoints) return;

  ctx.globalCompositeOperation = "destination-over";
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.lineWidth = 5;

  // Render each keypoint
  keypoints.forEach(({ name, score, x, y }) => {
    if (EXCLUDED_POINTS.has(name)) return;
    if (score < THRESHOLD) return;
    if (score < 0.7) ctx.fillStyle = "Yellow";
    else ctx.fillStyle = "Green";
    ctx.strokeStyle = "#ffffff";
    const circle = new Path2D();
    circle.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill(circle);
    ctx.stroke(circle);
  });

  // Render skeleton
  skeleton.forEach(([i, j]) => {
    const kp1 = keypoints[i];
    const kp2 = keypoints[j];

    if (EXCLUDED_POINTS.has(kp1.name)) return;
    if (EXCLUDED_POINTS.has(kp2.name)) return;

    if (angles) {
      let name1 = kp1.name.includes("left")
        ? kp1.name.replace("left", "right")
        : kp1.name.replace("right", "left");
      let name2 = kp2.name.includes("left")
        ? kp2.name.replace("left", "right")
        : kp2.name.replace("right", "left");

      let angle = angles[name1 + "-" + name2];
      if (angle === null || angle === undefined)
        angle = angles[name2 + "-" + name1];

      if (angle !== null && angle !== undefined) {
        ctx.strokeStyle =
          "hsl(" + getColorForAngleDifference(angle)[0] + ",100%,50%)";
      } else {
        ctx.strokeStyle = "#ffffff";
      }
    }

    // If score is null, just show the keypoint.
    const score1 = kp1.score != null ? kp1.score : 1;
    const score2 = kp2.score != null ? kp2.score : 1;

    if (score1 >= THRESHOLD && score2 >= THRESHOLD) {
      ctx.beginPath();
      ctx.moveTo(kp1.x, kp1.y);
      ctx.lineTo(kp2.x, kp2.y);
      ctx.stroke();
    }
  });
}
