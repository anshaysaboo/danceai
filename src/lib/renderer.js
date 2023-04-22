import * as posedetection from "@tensorflow-models/pose-detection";

const THRESHOLD = 0.5;

export function drawPose(ctx, keypoints, keypoints3d, skeleton, scores) {
  if (!canvas || !keypoints) return;

  ctx.globalCompositeOperation = "destination-over";
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Render each keypoint
  keypoints.forEach(({ name, score, x, y }) => {
    if (score < THRESHOLD) return;
    if (score < 0.7) ctx.fillStyle = "Yellow";
    else ctx.fillStyle = "Green";
    const circle = new Path2D();
    circle.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill(circle);
    ctx.stroke(circle);
  });

  // Render skeleton
  skeleton.forEach(([i, j]) => {
    const kp1 = keypoints[i];
    const kp2 = keypoints[j];

    if (scores) {
    } else {
      // If score is null, just show the keypoint.
      const score1 = kp1.score != null ? kp1.score : 1;
      const score2 = kp2.score != null ? kp2.score : 1;

      if (score1 >= THRESHOLD && score2 >= THRESHOLD) {
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.stroke();
      }
    }
  });
}
