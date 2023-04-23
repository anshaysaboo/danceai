// import detector from "@/lib/detector";
import { Inter } from "next/font/google";
import { useEffect, useState } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";

import createDetector from "@/lib/detector";
import { STATE } from "@/lib/params";
import { drawPose } from "@/lib/renderer";
import { getAngles } from "@/lib/comparePoses";
import { testPose } from "@/data/testPose";

const inter = Inter({ subsets: ["latin"] });
const model = poseDetection.SupportedModels.BlazePose;

export default function Home() {
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const video = document.querySelector("#video");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    //Core
    window.navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        video.srcObject = stream;
        video.onloadedmetadata = async (e) => {
          video.play();
          beginDetecting();
        };
      })
      .catch(() => {
        alert("You have give browser the permission to run Webcam and mic ;( ");
      });

    async function beginDetecting() {
      video.width = video.videoWidth;
      video.height = video.videoHeight;
      canvas.width = video.width;
      canvas.height = video.height;
      ctx.canvas.width = canvas.width;
      ctx.canvas.height = canvas.height;

      let detector = await createDetector();

      async function renderResult() {
        if (video.readyState < 2) {
          await new Promise((resolve) => {
            video.onloadeddata = () => {
              resolve(video);
            };
          });
        }

        let poses = null;
        let normalized = null;

        if (detector != null) {
          try {
            poses = await detector.estimatePoses(video, {
              maxPoses: STATE.modelConfig.maxPoses,
              flipHorizontal: true,
            });
            normalized =
              poseDetection.calculators.keypointsToNormalizedKeypoints(
                poses,
                video
              );

            if (poses.length > 0) {
              const angles = getAngles(poses, testPose);
              setFeedback(JSON.stringify(angles));
            }

            const skeleton = poseDetection.util.getAdjacentPairs(model);

            if (normalized.length > 0)
              drawPose(
                ctx,
                normalized[0].keypoints,
                normalized[0].keypoints3D,
                skeleton,
                canvas.width,
                canvas.height
              );
          } catch (error) {
            detector.dispose();
            detector = null;
            alert(error);
            console.error(error);
          }
        }
        return null;
      }

      async function renderPrediction() {
        await renderResult();
        window.requestAnimationFrame(renderPrediction);
      }

      renderPrediction();
    }
  }, []);

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between ${inter.className}`}
    >
      <div className="flex flex-row w-screen justify-items-center">
        <div className="relative">
          <video id="video" muted autoplay></video>
          <canvas id="canvas" className="absolute inset-0 z-50"></canvas>
        </div>
      </div>
      <div>
        {feedback != "" &&
          Object.keys(JSON.parse(feedback)).map((key) => {
            return (
              <p key={key}>
                {key}: {Math.round(JSON.parse(feedback)[key][0])}
              </p>
            );
          })}
      </div>
    </main>
  );
}
