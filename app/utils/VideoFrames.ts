export enum VideoToFramesMethod {
  fps,
  totalFrames,
}

export class VideoToFrames {
  /**
   * Extracts frames from the video and returns them as an array of imageData
   * @param videoUrl url to the video file (html5 compatible format) eg: mp4
   * @param amount number of frames per second or total number of frames that you want to extract
   * @param type [fps, totalFrames] The method of extracting frames: Number of frames per second of video or the total number of frames acros the whole video duration. defaults to fps
   * @param startCrop
   * @param endCrop
   */

  public static getFrames(
    videoUrl: string,
    amount: number,
    type: VideoToFramesMethod = VideoToFramesMethod.fps,
    startCrop: number,
    endCrop: number
  ): Promise<string[]> {
    return new Promise(
      (
        resolve: (frames: string[]) => void,
        reject: (error: string) => void
      ) => {
        let frames: string[] = [];
        let canvas: HTMLCanvasElement = document.createElement('canvas');
        let context: any = canvas.getContext('2d');
        let duration: number;

        let video = document.createElement('video');
        video.preload = 'auto';
        video.crossOrigin = 'anonymous';
        let that = this;
        video.addEventListener('loadeddata', async function () {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          duration = video.duration;

          console.log('duration', duration);

          let totalFrames: number = amount;
          if (type === VideoToFramesMethod.fps) {
            totalFrames = duration * amount;
          }
          for (let time = startCrop; time <= endCrop; time += duration / totalFrames) {
            frames.push(await that.getVideoFrame(video, context, canvas, time));
          }
          resolve(frames);
        });
        video.src = videoUrl;
        video.load();
      }
    );
  }

  private static getVideoFrame(
    video: HTMLVideoElement,
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    time: number
  ): Promise<string> {
    return new Promise(
      (resolve: (frame: string) => void, reject: (error: string) => void) => {
        let eventCallback = () => {
          video.removeEventListener('seeked', eventCallback);
          this.storeFrame(video, context, canvas, resolve);
        };
        video.addEventListener('seeked', eventCallback);
        video.currentTime = time;
      }
    );
  }

  private static storeFrame(
    video: HTMLVideoElement,
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    resolve: (frame: string) => void
  ) {
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    resolve(canvas.toDataURL());
  }
}
