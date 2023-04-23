// import detector from "@/lib/detector";
import { Inter } from "next/font/google";
import { useEffect } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";

import { STATE } from "@/lib/params";

const model = poseDetection.SupportedModels.BlazePose;
const detectorConfig = {
  runtime: "tfjs",
  enableSmoothing: true,
  modelType: "full",
};

async function createDetector() {
  const detector = await poseDetection.createDetector(model, detectorConfig);
  return detector;
}

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  useEffect(() => {
    async function boo() {
      const image = document.getElementById("goofy");
      let detector = await createDetector();
      let poses = await detector.estimatePoses(image, {
        maxPoses: STATE.modelConfig.maxPoses,
        flipHorizontal: false,
      });
    }
    boo();
  }, []);

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between ${inter.className}`}
    >
      <div className="flex flex-row w-screen justify-items-center">
        <div className="relative">Goofy</div>
        <img
          id="goofy"
          crossOrigin="anonymous"
          src="https://static8.depositphotos.com/1066611/830/i/950/depositphotos_8307808-stock-photo-attractive-man-dressed-casually-in.jpg"
        />
      </div>
    </main>
  );
}
