import { Inter } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";

import createDetector from "@/lib/detector";
import { STATE } from "@/lib/params";
import { drawPose } from "@/lib/renderer";
import { getAngles } from "@/lib/comparePoses";
import { testPose } from "@/data/testPose";

const model = poseDetection.SupportedModels.BlazePose;
const skeleton = poseDetection.util.getAdjacentPairs(model);

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const videoRef = useRef(null);
  const [uTubeRef, setUTubeState] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [feedback, setFeedback] = useState("");

  const getYoutubeVideo = async () => {
      const video = await fetch("api/check-download", {method: "POST", headers: {
        "Content-Type": "application/json",
      }, body: JSON.stringify({url:localStorage.getItem("url")})});
      const {response} = await video.json();
      const info = response.videoDetails;
      const formats = response.formats;
      const formatUsing = formats.find((element)=> (element.container == "mp4" && element.quality == "hd720"));
      const vname = info.title;
      const url = info.video_url;
      const itag = formatUsing.itag;
      const format = formatUsing.container;

      const finalResp = await fetch("api/download", {method: "POST", 
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        vname,
        itag,
        format
      })});
      console.log(finalResp);
      const blob = await finalResp.blob();
      setUTubeState(URL.createObjectURL(blob));
      setLoaded(true);
  }
  const useUploadedFile = ()=>{
    setUTubeState(localStorage.getItem("url"));
    setLoaded(true);
  }
  useEffect(()=>{
    if (JSON.parse(localStorage.getItem("upload")) === true) {
      useUploadedFile();
    } else {
      getYoutubeVideo();
    }
  },[])

  useEffect(() => {
    const userVideo = document.getElementById("video");
    const modelVideo = document.getElementById("model-video");
    const userCanvas = document.getElementById("canvas");
    const modelCanvas = document.getElementById("model-canvas");
    const userCtx = canvas.getContext("2d");
    const modelCtx = modelCanvas.getContext("2d");
    const modelContainer = document.getElementById("model-container");

    function setupSizing(video, canvas, ctx) {
      video.width = video.clientWidth;
      video.height = video.clientHeight;
      canvas.width = video.width;
      canvas.height = video.height;
      ctx.canvas.width = canvas.width;
      ctx.canvas.height = canvas.height;
    }

    async function fetchYoutube() {
      await getYoutubeVideo();
      modelVideo.width = modelContainer.clientWidth;
      modelVideo.height =
        (modelVideo.videoHeight / modelVideo.videoWidth) *
        modelContainer.clientWidth;
      modelCanvas.width = modelVideo.width;
      modelCanvas.height = modelVideo.height;
      modelCtx.canvas.width = modelCanvas.width;
      modelCtx.canvas.height = modelCanvas.height;
    }

    fetchYoutube();

    // VIDEO SETUP
    window.navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
        },
      })
      .then((stream) => {
        userVideo.srcObject = stream;
        userVideo.onloadedmetadata = async (e) => {
          userVideo.play();
          setupSizing(userVideo, userCanvas, userCtx);
          beginDetecting();
        };
      })
      .catch(() => {
        alert("You have give browser the permission to run Webcam and mic ;( ");
      });

    // MOTION DETECTION
    async function beginDetecting() {
      let userDetector = await createDetector();
      let modelDetector = await createDetector();

      async function renderResult() {
        if (userVideo.readyState < 2) {
          await new Promise((resolve) => {
            userVideo.onloadeddata = () => {
              resolve(userVideo);
            };
          });
        }

        if (modelVideo.readyState < 2) {
          await new Promise((resolve) => {
            modelVideo.onloadeddata = () => {
              resolve(modelVideo);
            };
          });
        }

        if (userDetector != null && modelDetector != null) {
          try {
            const [userPoses, modelPoses] = await Promise.all([
              userDetector.estimatePoses(userVideo, {
                maxPoses: 1,
                flipHorizontal: true,
              }),
              modelDetector.estimatePoses(modelVideo, {
                maxPoses: 1,
                flipHorizontal: false,
              }),
            ]);

            const normalized =
              poseDetection.calculators.keypointsToNormalizedKeypoints(
                userPoses,
                userVideo
              );

            if (normalized.length > 0) {
              let angleScores;
              if (userPoses.length > 0 && modelPoses.length > 0) {
                angleScores = getAngles(userPoses, modelPoses);
                setFeedback(JSON.stringify(angleScores));
              }
              drawPose(
                userCtx,
                normalized[0].keypoints,
                normalized[0].keypoints3D,
                skeleton
              );
            }
            if (modelPoses.length > 0) {
              const normalizedKeypoints = modelPoses[0].keypoints.map(
                (keypoint) => {
                  keypoint.x =
                    (keypoint.x / modelVideo.videoWidth) * modelCanvas.width;
                  keypoint.y =
                    (keypoint.y / modelVideo.videoHeight) * modelCanvas.height;
                  return keypoint;
                }
              );

              drawPose(
                modelCtx,
                normalizedKeypoints,
                modelPoses[0].keypoints3D,
                skeleton
              );
            }
          } catch (error) {
            userDetector.dispose();
            modelDetector.dispose();
            userDetector = null;
            modelDetector = null;
            alert(error);
            console.error(error);
          }
        }
      }

      async function renderPrediction() {
        await renderResult();
        window.requestAnimationFrame(renderPrediction);
      }

      renderPrediction();
    }
  }, [videoRef]);
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-around ${inter.className}`}
    >
      <div className="grid grid-cols-2 justify-items-center items-center gap-12">
        <div className="relative">
          <video id="video" muted autoplay></video>
          <canvas id="canvas" className="absolute inset-0 z-50"></canvas>
        </div>
        <div id="model-container" className="relative w-full">
          {!loaded && <p>Loading...</p>}
          <video
            id="model-video"
            className="w-full"
            src={uTubeRef}
            autoPlay
            controls
          />
          <canvas
            id="model-canvas"
            className="absolute inset-0 z-50"
            style={{ pointerEvents: "none" }}
          ></canvas>
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
