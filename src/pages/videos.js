import { Inter, Abril_Fatface } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { FaPlay, FaPause } from "react-icons/fa";

import createDetector from "@/lib/detector";
import { drawPose } from "@/lib/renderer";
import { getAngles, getScore } from "@/lib/comparePoses";
import { FEEDBACK_INTERVAL } from "@/lib/config";

const model = poseDetection.SupportedModels.BlazePose;
const skeleton = poseDetection.util.getAdjacentPairs(model);

const inter = Inter({ subsets: ["latin"] });

const Abril = Abril_Fatface({
  weight: ["400"],
style: ["normal"],
subsets: ["latin", "latin-ext"]});

export default function Home() {
  const modelVideoRef = useRef();
  const [uTubeRef, setUTubeState] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [playbackRate, setPlaybackRate] = useState(1);
  const [paused, setPaused] = useState(true);

  const updatePlaybackRate = (rate) => {
    modelVideoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const updatePaused = () => {
    if (paused) {
      modelVideoRef.current.play();
      setPaused(false);
    } else {
      modelVideoRef.current.pause();
      setPaused(true);
    }
  };

  const getYoutubeVideo = async () => {
    const video = await fetch("api/check-download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: localStorage.getItem("url") }),
    });
    const { response } = await video.json();
    const info = response.videoDetails;
    const formats = response.formats;
    const formatUsing = formats.find(
      (element) => element.container == "mp4" && element.quality == "hd720"
    );
    const vname = info.title;
    const url = info.video_url;
    const itag = formatUsing.itag;
    const format = formatUsing.container;

    const finalResp = await fetch("api/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        vname,
        itag,
        format,
      }),
    });
    const blob = await finalResp.blob();
    setUTubeState(URL.createObjectURL(blob));
    setLoaded(true);
  };

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

    async function fetchVideo() {
      if (JSON.parse(localStorage.getItem("upload")) === true) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        modelVideo.src = localStorage.getItem("url");
        await new Promise((resolve) => {
          modelVideo.onloadeddata = () => {
            resolve(modelVideo);
          };
        });
        setLoaded(true);
      } else {
        await getYoutubeVideo();
      }
      modelVideo.width = modelContainer.clientWidth;
      modelVideo.height =
        (modelVideo.videoHeight / modelVideo.videoWidth) *
        modelContainer.clientWidth;
      modelCanvas.width = modelVideo.width;
      modelCanvas.height = modelVideo.height;
      modelCtx.canvas.width = modelCanvas.width;
      modelCtx.canvas.height = modelCanvas.height;
    }

    fetchVideo();

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
      let timer = 0;
      let totalScore = 0,
        scoreCounter = 0;

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
                skeleton,
                angleScores
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

            // Return score
            if (userPoses.length > 0 && modelPoses.length > 0) {
              let angleScores = getAngles(userPoses, modelPoses);
              let score = getScore(angleScores);
              return score;
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

        return null;
      }

      async function renderPrediction() {
        const start = performance.now();
        const score = await renderResult();
        const end = performance.now();

        if (!modelVideoRef.current.paused) {
          timer += end - start;
          if (score != null) {
            totalScore += score;
            scoreCounter++;
          }
        }

        if (timer > FEEDBACK_INTERVAL) {
          const average = totalScore / scoreCounter;
          totalScore = 0;
          scoreCounter = 0;
          timer = 0;
          console.log(average);
        }
        window.requestAnimationFrame(renderPrediction);
      }

      // Setup handling for seeking video
      modelVideo.onseeked = function () {
        renderPrediction();
      };

      renderPrediction();
    }
  }, []);
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-around bg-background ${inter.className}`}
    >
      <div className="flex w-full h-1/12">
        <h1 className={"text-pink-pop text-5xl ml-5 " + Abril.className}>dance.ai</h1>
      </div>
      <div className="grid grid-cols-2 justify-items-center items-center gap-12 mx-12">
        <div className="relative">
          <video id="video" muted autoplay></video>
          <canvas id="canvas" className="absolute inset-0 z-50"></canvas>
        </div>
        <div className="relative w-full">
          {!loaded && <p>Loading your video...</p>}
          <div id="model-container" className="relative w-full">
            <video
              id="model-video"
              className="w-full"
              src={uTubeRef}
              controls
              ref={modelVideoRef}
            />
            <canvas
              id="model-canvas"
              className="absolute inset-0 z-50"
              style={{ pointerEvents: "none" }}
            ></canvas>
          </div>
          <div className="w-full flex justify-between mt-5">
            <div>
              <button onClick={() => updatePaused()} className="text-2xl">
                {paused ? <FaPlay /> : <FaPause />}
              </button>
            </div>
            <div className="flex flex-row gap-4">
              {[0.25, 0.5, 1, 1.5, 1.75].map((val) => {
                return (
                  <button
                    onClick={() => updatePlaybackRate(val)}
                    key={val}
                    className={`${val === playbackRate ? "font-bold" : ""}`}
                  >
                    {val}x
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {/* <div>
        {feedback != "" &&
          Object.keys(JSON.parse(feedback)).map((key) => {
            return (
              <p key={key}>
                {key}: {Math.round(JSON.parse(feedback)[key])}
              </p>
            );
          })}
      </div> */}
    </main>
  );
}
