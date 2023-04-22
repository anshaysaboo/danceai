import { Inter } from 'next/font/google'
import React, { useState } from 'react'
import { useRouter } from 'next/router'
const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const sendURL = () => {
    localStorage.setItem("url", url);
    router.push({pathname: "/videos", query:{url}});
  }
  return (
    <main className='h-screen w-screen bg-yellow flex flex-col'>
        <input className='bg-white rounded-md border border-black text-black' type='text' placeholder='https://www.youtube.com/...'
        value={url} onChange={(e)=>setUrl(e.target.value)}/>
        <button className="block border px-4 py-2 w-1/2 mt-5 md:mt-0 md:w-auto mx-auto hover:bg-white hover:border-blue-dark hover:text-blue-dark text-sm rounded-full bg-blue-light text-white border-white transition-colors"
        onClick={()=>sendURL()}>
            Use Video
        </button>
    </main>
  )
}

