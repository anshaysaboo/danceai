import { Inter } from "next/font/google";
import { Abril_Fatface } from "next/font/google";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
const inter = Inter({ subsets: ["latin"] });
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";

const Abril = Abril_Fatface({
  weight: ["400"],
  style: ["normal"],
  subsets: ["latin", "latin-ext"],
});

const CURATED = [
  {
    image: "/img/ariana.webp",
    title: "Pop Dance",
    description: "Choreo for Dangerous Woman by Ariana Grande.",
    url: "https://www.youtube.com/watch?v=7tkfX2phlfE&t=2s",
  },
  {
    image: "/img/glass.png",
    title: "Hip Hop Dance",
    description: "Choreo for Heat Waves by Glass Animals.",
    url: "https://www.youtube.com/watch?v=wzVONhY-oa8",
  },
  {
    image: "/img/yoga.png",
    title: "Morning Yoga",
    description: "Guided Yoga workout for 10 minutes.",
    url: "https://www.youtube.com/watch?v=d8QqXLV3tWM",
  },
];

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");

  const sendURL = () => {
    localStorage.setItem("url", url);
    localStorage.setItem("upload", false);
    router.push({ pathname: "/videos", query: { url } });
  };

  const handleFile = (e) => {
    const video = e.target.files[0];
    const videoUrl = URL.createObjectURL(video);
    setUrl(videoUrl);
    localStorage.setItem("url", videoUrl);
    localStorage.setItem("upload", true);
    router.push("/videos");
  };

  const sendCurated = (url) => {
    localStorage.setItem("url", url);
    localStorage.setItem("upload", false);
    router.push({ pathname: "/videos", query: { url } });
  };

  function range(size, startAt = 0) {
    return [...Array(size).keys()].map((i) => i + startAt);
  }

  return (
    <>
      <Head>
        {range(10, 1).map((i) => {
          return (
            <link key={i} rel="preload" href={`img/${i}.mp4`} as="video" />
          );
        })}
        <link rel="preload" href="img/1.MP4" as="video" />
        <link rel="preload" href="img/2.MP4" as="video" />
        <link rel="preload" href="img/3.MP4" as="video" />
        <link rel="preload" href="img/4.MP4" as="video" />
        <link rel="preload" href="img/5.MP4" as="video" />
        <link rel="preload" href="img/6.MP4" as="video" />
        <link rel="preload" href="img/7.MP4" as="video" />
        <link rel="preload" href="img/8.MP4" as="video" />
        <link rel="preload" href="img/9.MP4" as="video" />
        <link rel="preload" href="img/10.MP4" as="video" />
      </Head>
      <main
        className={`h-screen w-screen bg-yellow flex flex-col ${inter.className} max-w-full overflow-hidden bg-background`}
        id="background"
      >
        <div
          id="permas"
          className="flex gap-10 h-1/4 overflow-x-hidden pt-4 opacity-50"
        >
          {range(10, 1)
            .concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
            .map((i) => {
              return (
                <video
                  key={i}
                  className="rounded bg-white/40 w-[100px]"
                  src={`img/${i}.mp4`}
                  autoPlay
                  muted
                  loop
                />
              );
            })}
        </div>
        <div className="w-full flex flex-row-reverse h-2/3 z-40">
          <div
            id="card"
            className="rounded-2xl bg-transparent h-5/6 w-full my-auto flex flex-col justify-center items-center"
          >
            <div className="h-1/6 w-full justify-center flex flex-col items-center mb-8">
              <h1 className={"text-pink-pop text-5xl " + Abril.className}>
                MotionMuse
              </h1>
              <p className="text-white mt-2 w-1/3 text-center opacity-80">
                Your at-home AI coach for dance, yoga, and other workouts.
                Upload an activity video to get started.
              </p>
            </div>

            <div className="grid grid-cols-2 h-5/6 w-2/3 mx-10">
              <div className="w-full h-full">
                <h2 className="text-2xl text-white mt-6 font-semibold mb-4">
                  Pick a curated activity
                </h2>
                <div>
                  {CURATED.map(({ title, description, url, image }) => {
                    return (
                      // eslint-disable-next-line react/jsx-key
                      <a href="#" onClick={() => sendCurated(url)}>
                        <div
                          className="flex flex-row gap-6 mb-4 text-white"
                          key={title}
                        >
                          <Image
                            src={image}
                            width="130"
                            height="95"
                            className="rounded"
                          />
                          <div className="flex flex-col h-full justify-center">
                            <p className="font-bold hover:underline transition">
                              {title}
                            </p>
                            <p className="text-white/60">{description}</p>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>

              <div className="w-full h-full flex flex-col px-10">
                <h2 className="text-2xl text-white mt-6 font-semibold">
                  Use a video from YouTube
                </h2>
                <input
                  className="mt-5 border-b-2 text-white bg-white/20 placeholder-white/30 p-2 rounded appearance-none focus:outline-none"
                  type="text"
                  placeholder="https://www.youtube.com/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <button
                  className="bg-[#9333ea] w-[140px] hover:bg-[#7e22ce] transition rounded text-white font-bold w-fit px-4 py-2 mt-6"
                  onClick={() => sendURL()}
                >
                  Use Video
                </button>
                <h2 className="text-2xl text-white mt-16 font-semibold">
                  Or upload your own
                </h2>
                <label
                  htmlFor="file-upload"
                  className="w-[140px] text-center cursor-pointer bg-[#9333ea] hover:bg-[#7e22ce] transition rounded text-white font-bold w-fit px-4 py-2 mt-6 mt-10"
                >
                  Upload
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    value={""}
                    onChange={handleFile}
                    accept="video/*"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div
          id="permas2"
          className="flex gap-10 h-1/4 overflow-x-hidden pb-4 opacity-50"
        >
          {range(10, 1)
            .concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
            .map((i) => {
              return (
                <video
                  key={i}
                  className="rounded bg-white/40 w-[100px]"
                  src={`img/${i}.mp4`}
                  autoPlay
                  muted
                  loop
                />
              );
            })}
        </div>
      </main>
    </>
  );
}
