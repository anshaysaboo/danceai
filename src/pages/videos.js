import { Inter, Abril_Fatface } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { FaPlay, FaPause } from "react-icons/fa";

import createDetector from "@/lib/detector";
import { drawPose } from "@/lib/renderer";
import { getAngles, getScore } from "@/lib/comparePoses";
import { FEEDBACK_INTERVAL } from "@/lib/config";
import Link from "next/link";

const model = poseDetection.SupportedModels.BlazePose;
const skeleton = poseDetection.util.getAdjacentPairs(model);

const inter = Inter({ subsets: ["latin"] });

const Abril = Abril_Fatface({
  weight: ["400"],
  style: ["normal"],
  subsets: ["latin", "latin-ext"],
});

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

  const showFeedback = (score) => {
    const feedbackContainer = document.getElementById("feedback");
    let color, text;
    if (score > 0.7) {
      color = "#16a34a";
      text = "Amazing!";
    } else if (score > 0.5) {
      color = "#facc15";
      text = "Alright!";
    } else {
      color = "#dc2626";
      text = "Needs some work!";
    }
    feedbackContainer.innerText = text;
    feedbackContainer.style.color = color;
  };

  const updateScore = (score, id) => {
    const feedbackContainer = document.getElementById(id);
    let color;
    if (score > 0.7) {
      color = "#16a34a";
    } else if (score > 0.5) {
      color = "#facc15";
    } else {
      color = "#dc2626";
    }
    feedbackContainer.innerText = Math.floor(score * 100);
    feedbackContainer.style.color = color;
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
      let overallScore = 0,
        overallScoreCounter = 0;

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
            console.error(error);
            alert(error);
          }
        }

        return null;
      }

      async function renderPrediction() {
        // SCORE HANDLING
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

        // Update score
        updateScore(score, "current-score");

        const seconds = Math.floor(timer / 1000);
        if (seconds === FEEDBACK_INTERVAL) {
          const average = totalScore / scoreCounter;
          totalScore = 0;
          scoreCounter = 0;
          console.log(average);
          if (!document.getElementById("feedback").innerText) {
            showFeedback(average);

            // Update overall score
            overallScore =
              (overallScore * overallScoreCounter + average) /
              (overallScoreCounter + 1);
            overallScoreCounter++;
            updateScore(overallScore, "overall-score");
          }
        } else if (seconds === FEEDBACK_INTERVAL + 2) {
          document.getElementById("feedback").innerText = "";
          timer = 0;
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
      className={`flex min-h-screen flex-col items-center justify-between bg-background ${inter.className}`}
    >
      <div className="flex flex-col w-full justify-center items-center py-12">
        <h1 className={"text-pink-pop text-6xl ml-5 " + Abril.className}>
          MotionMuse
        </h1>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="text-white mt-4 hover:underline">
          Choose a new video
        </a>
      </div>
      <div className="grid grid-cols-2 justify-items-center items-center gap-12 mx-12">
        <div className="relative">
          <video id="video" muted autoplay></video>
          <canvas id="canvas" className="absolute inset-0 z-50"></canvas>
        </div>
        <div className="relative w-full">
          {!loaded && <p className="text-white mb-5">Loading your video...</p>}
          <div id="model-container" className="relative w-fit">
            <video
              id="model-video"
              className="w-auto max-w-full max-h-[45vh] bg-white/40"
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
              <button
                onClick={() => updatePaused()}
                className="text-xl text-white p-3 bg-pink-pop rounded-full"
              >
                {paused ? <FaPlay /> : <FaPause />}
              </button>
            </div>
            <div className="flex flex-row gap-4">
              {[0.25, 0.5, 1, 1.5, 1.75].map((val) => {
                return (
                  <button
                    onClick={() => updatePlaybackRate(val)}
                    key={val}
                    className={`text-white ${
                      val === playbackRate ? "font-bold" : ""
                    }`}
                  >
                    {val}x
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center w-full pb-10">
        <div
          id="feedback"
          className="h-[80px] text-center text-[50px] font-bold mt-12"
        ></div>
        <div className="flex flex-row gap-12">
          <div className="flex flex-col items-center">
            <span id="overall-score" className="text-4xl font-bold text-white">
              -
            </span>
            <span className="text-sm font-bold text-white">OVERALL</span>
          </div>
          <div className="flex flex-col items-center">
            <span id="current-score" className="text-4xl font-bold text-white">
              -
            </span>
            <span className="text-sm font-bold text-white">CURRENT</span>
          </div>
        </div>
      </div>
    </main>
  );
}
