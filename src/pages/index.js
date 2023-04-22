import { Inter } from 'next/font/google'
import React, {useEffect, useRef} from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const videoRef = useRef(null);
  useEffect(() => {
    getVideo();
  }, [videoRef]);
  const videoConfig = {
    'audio': false,
    'video': {
      facingMode: 'user',
      width: '500',
    }
  };
  const getVideo = () => {
    navigator.mediaDevices
      .getUserMedia(videoConfig)
      .then(stream => {
        let video = videoRef.current;
        video.srcObject = stream;
        video.play();
      })
      .catch(err => {
        console.error("error:", err);
      });
  };
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    > 
      <video ref={videoRef} className="flipped-x"/>
    </main>
  )
}
