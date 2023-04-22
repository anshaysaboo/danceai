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
    router.push({pathname: "/videos", query:{url}});
  }
  return (
    <main className='h-screen w-screen bg-yellow flex flex-col'>
      <div className='my-auto px-24'>
        <input className=' w-full bg-white rounded-md border border-black text-black' type='text' placeholder='https://www.youtube.com/...'
        value={url} onChange={(e)=>setUrl(e.target.value)}/>
        <button className="block border px-4 py-2 w-1/2 mt-5 md:mt-0 md:w-auto mx-auto hover:bg-white hover:border-black hover:text-black text-sm rounded-full bg-black text-white border-white transition-colors"
        onClick={()=>sendURL()}>
            Use Video
        </button>

      </div>
    </main>
  );
}

