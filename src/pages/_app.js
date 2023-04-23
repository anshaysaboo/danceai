import "@/styles/globals.css";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import "@mediapipe/pose";
import Head from "next/head";

export default function App({ Component, pageProps }) {
  return <>
  <Head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js" defer></script>
    <script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.halo.min.js" defer></script>
		<link rel="stylesheet" href="https://use.typekit.net/eqx3jwb.css"/>
  </Head>
  <Component {...pageProps} />
  
  </>;
}
