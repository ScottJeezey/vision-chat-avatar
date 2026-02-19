/**
 * Video recording utility for liveness checks
 * Records 2-3 seconds of webcam footage and returns as data URL
 */

export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  async startRecording(stream: MediaStream, durationMs: number = 3000): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        this.chunks = [];

        // Create MediaRecorder
        const options = { mimeType: 'video/webm;codecs=vp8' };
        this.mediaRecorder = new MediaRecorder(stream, options);

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            this.chunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = async () => {
          const blob = new Blob(this.chunks, { type: 'video/webm' });
          const dataUrl = await this.blobToDataUrl(blob);
          resolve(dataUrl);
        };

        this.mediaRecorder.onerror = (error) => {
          reject(error);
        };

        // Start recording
        this.mediaRecorder.start();

        // Stop after duration
        setTimeout(() => {
          if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
          }
        }, durationMs);
      } catch (error) {
        reject(error);
      }
    });
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }
}
