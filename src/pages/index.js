import { Inter } from 'next/font/google'
import React, { useState } from 'react'
import { useRouter } from 'next/router'
const inter = Inter({ subsets: ['latin'] })
import Image from "next/image";

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
      <div className='my-auto px-24'>
        <input className=' w-full bg-transparent border-b border-white text-white placeholder-gray-400 appearance-none focus:outline-none' type='text' placeholder='https://www.youtube.com/...'
        value={url} onChange={(e)=>setUrl(e.target.value)}/>
        <button className="block border px-4 py-2 w-1/12 mt-5 mx-auto hover:bg-white hover:border-main hover:text-main text-sm rounded-full bg-main text-white border-white transition-colors"
        onClick={()=>sendURL()}>
            Use Video
        </button>
      </div>
      <h2 className='text-3xl text-white mx-auto my-auto'>or upload your own video</h2>
      <div className='my-auto px-24 w-full flex'>
      <label htmlFor="file-upload"
          className="cursor-pointer rounded-full bg-main text-white w-1/6 mx-auto text-center border border-white hover:bg-white hover:text-main hover:border-main transition-colors"
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

