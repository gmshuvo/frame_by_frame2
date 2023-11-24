"use client";
import React, { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { VideoToFrames, VideoToFramesMethod } from "../utils/VideoFrames";
import {
  VideoJSOptions,
  dummyAspectRatio,
  dummyVideoLink,
  dummyVideoThumbnailLink,
  dummyVideoType,
} from "../dummy";
import Image from "next/image";

import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import * as helpers from "../utils/helpers";
import TimelineEditor from "./TimeEditor";

const FF = createFFmpeg({
  // log: true,
  corePath: "https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js",
});

const VideoPlayer: React.FC<{ videoSource: string }> = ({ videoSource }) => {
  // console.log(videoSource)
  const videoJsOptions: VideoJSOptions = {
    autoplay: false,
    controls: true,
    poster: dummyVideoThumbnailLink,
    sources: [
      {
        src: videoSource, // Use the provided video source
        type: dummyVideoType,
      },
    ],
    aspectRatio: dummyAspectRatio,
    playbackRates: [1, 0.5],
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef(null);

  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [videoPlayerInformation, setVideoPlayerInformation] =
    useState(videoJsOptions);
  const [frames, setFrames] = useState<string[]>([]); // To store frames
  const [thumbnailIsProcessing, setThumbnailIsProcessing] = useState(false);
  const [trimIsProcessing, setTrimIsProcessing] = useState(false);
  const [trimmedVideoFile, setTrimmedVideoFile] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    let videoElement: HTMLVideoElement;

    const loadVideo = async () => {
      if (!videoRef.current) {
        return;
      }
      try {
        const vjsPlayer = videojs(videoRef.current, videoPlayerInformation);
      } catch (error) {
        console.error("Video initialization error:", error);
      }
    };
    loadVideo();

    return () => {
      canceled = true;
    };
  }, [videoPlayerInformation, videoSource]);

  //get thumbnails
  const getThumbnails = async () => {
    const duration = 200;
    if (!FF.isLoaded()) await FF.load();
    console.log("get thumbnails");
    setThumbnailIsProcessing(true);
    let MAX_NUMBER_OF_IMAGES = 25;
    let NUMBER_OF_IMAGES = duration < MAX_NUMBER_OF_IMAGES ? duration : 25;
    let offset =
      duration === MAX_NUMBER_OF_IMAGES ? 1 : duration / NUMBER_OF_IMAGES;

    const arrayOfImageURIs = [];
    FF.FS("writeFile", "input.mp4", await fetchFile(videoSource));

    for (let i = 0; i < NUMBER_OF_IMAGES; i++) {
      let startTimeInSecs = helpers.toTimeString(Math.round(i * offset));

      try {
        await FF.run(
          "-ss",
          startTimeInSecs,
          "-i",
          "input.mp4",
          "-t",
          "00:00:1.000",
          "-vf",
          `scale=150:-1`,
          `img${i}.png`
        );
        const data = FF.FS("readFile", `img${i}.png`);

        console.log(data);

        let blob = new Blob([data.buffer], { type: "image/png" });
        let dataURI = await helpers.readFileAsBase64(blob);
        FF.FS("unlink", `img${i}.png`);
        arrayOfImageURIs.push(dataURI);
      } catch (error) {
        console.log({ message: error });
      }
    }
    setThumbnailIsProcessing(false);

    return arrayOfImageURIs;
  };

  const handleTrim = async () => {
    setTrimIsProcessing(true);

    let startTime = "100.00";
    let offset = "41.75";
    console.log(
      startTime,
      offset,
      helpers.toTimeString(startTime),
      helpers.toTimeString(offset)
    );

    try {
      FF.FS("writeFile", "input.mp4", await fetchFile(videoSource));
      // await FF.run('-ss', '00:00:13.000', '-i', inputVideoFile.name, '-t', '00:00:5.000', 'ping.mp4');
      await FF.run(
        "-ss",
        helpers.toTimeString(startTime),
        "-i",
        "input.mp4",
        "-t",
        helpers.toTimeString(offset),
        "-c",
        "copy",
        "ping.mp4"
      );

      const data = FF.FS("readFile", "ping.mp4");
      console.log(data);
      const dataURL = await helpers.readFileAsBase64(
        new Blob([data.buffer], { type: "video/mp4" })
      );

      console.log(dataURL);

      FF.FS("unlink", "input.mp4");

      setTrimmedVideoFile(dataURL);
    } catch (error) {
      console.log(error);
    } finally {
      setTrimIsProcessing(false);
    }
  };

  const handleCrop = async (e: any) => {
    e.preventDefault();
    if (!videoRef.current) return;

    const thumbnails = await getThumbnails();
    setThumbnails(thumbnails);
    console.log(thumbnails);

    //trim video

    try {
      await handleTrim();
      if (videoRef.current) {
        if (trimmedVideoFile) {
          videoRef.current.src = trimmedVideoFile;
        }
      }
    } catch (err) {
      console.log(err);
    }

    // const blob = await fetch(videoSource).then(response => response.blob());
    // // console.log(URL.createObjectURL(blob))
    // const startCrop = videoRef.current.currentTime;
    // const endCrop = videoRef.current.duration;

    // console.log(startCrop, endCrop)

    // try {
    //   const frames = await VideoToFrames.getFrames(
    //     URL.createObjectURL(blob),
    //     60, // Frames per second
    //     VideoToFramesMethod.totalFrames,
    //     startCrop,
    //     endCrop
    //   );

    //   // Now, you can set the frames in the state or process them as needed.
    //   console.log(startCrop, endCrop, frames);

    //   setFrames(frames);
    // } catch (error) {
    //   console.error('Error extracting frames:', error);
    // }
  };

  return (
    <>
      <div className="w-[100%] h-full">
        <video ref={videoRef} className="video-js" />

        {/* <div className="">
        <button >Crop</button>
      </div> */}
        {/* <canvas id='canvas-id' width="320" height="180" style={{ border: '1px solid black' }} >
      </canvas> */}

        {/* Render frames */}
        {thumbnails.length > 0 && (
          <div className="flex max-w-[100%] overflow-x-scroll mt-24">
            {thumbnails.map((thumbnail, index) => (
              <Image
                key={index}
                src={thumbnail}
                alt={`Thumbnail ${index + 1}`}
                width={100}
                height={100}
              />
            ))}
          </div>
        )}

        <button
          className="mt-10 px-3 py-2 bg-blue-400 text-center"
          onClick={handleCrop}
        >
          Crop
        </button>
      </div>
      <TimelineEditor />
    </>
  );
};

export default VideoPlayer;
