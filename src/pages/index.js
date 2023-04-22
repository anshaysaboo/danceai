import { Inter } from 'next/font/google'
import { Abril_Fatface } from 'next/font/google'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
const inter = Inter({ subsets: ['latin'] })
import Image from "next/image";

const Abril = Abril_Fatface({
  weight: ["400"],
style: ["normal"],
subsets: ["latin", "latin-ext"]});

export default function Home() {
  useEffect(()=>{
    if (window.VANTA) window.VANTA.HALO({
      el: "#background",
      mouseControls: false,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.00,
      minWidth: 200.00,
      xOffset: -0.15,
    })
    });
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
    <main className={`h-screen w-screen bg-yellow flex flex-col ${inter.className}`} id="background">
      <div className='w-full flex flex-row-reverse h-full'>
        <div id='card' className='rounded-2xl bg-transparent h-5/6 w-1/2 my-auto flex flex-col'>
          <div className='h-1/6 w-full justify-center flex mt-12'>
          <h1 className={"text-pink-pop text-5xl " + Abril.className}>dance.ai</h1>
        </div>
          <h2 className='text-2xl text-pink-100 mx-auto mt-12 font-semibold w-2/3'>Upload a video from youtube</h2>
            <input className=' w-2/3 mx-auto bg-transparent mt-10 border-b border-pink-100 text-pink-100 placeholder-pink-50 appearance-none focus:outline-none' type='text' placeholder='https://www.youtube.com/...'
            value={url} onChange={(e)=>setUrl(e.target.value)}/>
            <button className="block border px-4 py-2 w-1/3 mt-5 mx-auto hover:bg-pink-100 hover:border-main hover:text-main text-sm rounded-full bg-main text-pink-100 border-pink-100 transition-colors"
            onClick={()=>sendURL()}>
                Use Video
            </button>
          <h2 className='text-2xl text-pink-100 mx-auto mt-16 font-semibold w-2/3'>or upload your own video</h2>
          <label htmlFor="file-upload"
              className="cursor-pointer text-sm rounded-full px-4 py-2  bg-main text-pink-100 w-1/3 mx-auto text-center border border-pink-100 hover:bg-pink-100 hover:text-main hover:border-main transition-colors mt-10"
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
      </div>
      
      
    </main>
  );
}

