import { Inter } from 'next/font/google'
import React, {useEffect, useRef, useState} from 'react'
import FileSaver from 'file-saver';

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const videoRef = useRef(null);
  const [uTubeRef, setUTubeState] = useState("");
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
  const getYoutubeVideo = async () => {
    const video = await fetch("api/check-download");
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
     finalResp.blob().then(blob=> setUTubeState(URL.createObjectURL(blob)));
     
     
  }
  useEffect(()=>{getYoutubeVideo();},[])
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    > 
      <video ref={videoRef} className="flipped-x"/>
      <video src={uTubeRef} autoPlay/>
    </main>
  )
}
