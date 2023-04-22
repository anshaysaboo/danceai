import { Inter } from 'next/font/google'
import { Abril_Fatface } from 'next/font/google'
import React, { useState } from 'react'
import { useRouter } from 'next/router'
const inter = Inter({ subsets: ['latin'] })
import Image from "next/image";

const Abril = Abril_Fatface({
  weight: ["400"],
style: ["normal"],
subsets: ["latin", "latin-ext"]});

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const sendURL = () => {
    localStorage.setItem("url", url);
    localStorage.setItem("upload", false);
    router.push({pathname: "/videos", query:{url}});
  }
  const handleFile = (e) => {
    const video = e.target.files[0];
    console.log(video);
    const videoUrl = URL.createObjectURL(video);
    setUrl(videoUrl);
    localStorage.setItem("url", videoUrl);
    localStorage.setItem("upload", true);
    router.push("/videos");
  }
  return (
    <main className='h-screen w-screen bg-yellow flex flex-col bg-background'>
      <div className='h-1/12 w-full flex'>
        <h1 className={"text-pink-pop text-5xl ml-4 mt-4 " + Abril.className}>dance.ai</h1>
      </div>
      <h2 className='text-3xl text-pink-pop mx-auto my-auto'>Upload a video from youtube</h2>
      <div className='my-auto px-24'>
        <input className=' w-full bg-transparent border-b border-pink-pop text-pink-pop placeholder-pink-300 appearance-none focus:outline-none' type='text' placeholder='https://www.youtube.com/...'
        value={url} onChange={(e)=>setUrl(e.target.value)}/>
        <button className="block border px-4 py-2 w-1/12 mt-5 mx-auto hover:bg-pink-200 hover:border-main hover:text-main text-sm rounded-full bg-main text-pink-300 border-pink-200 transition-colors"
        onClick={()=>sendURL()}>
            Use Video
        </button>
      </div>
      <h2 className='text-3xl text-pink-pop mx-auto my-auto'>or upload your own video</h2>
      <div className='my-auto px-24  flex'>
      <label htmlFor="file-upload"
          className="cursor-pointer rounded-full bg-main text-pink-300 w-1/6 mx-auto text-center border border-pink-200 hover:bg-pink-200 hover:text-main hover:border-main transition-colors"
      >
          Upload 
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="sr-only"
            value={""}
            onChange={handleFile}
            accept='video/*'
          />
          </label>
      </div>
    </main>
  );
}

