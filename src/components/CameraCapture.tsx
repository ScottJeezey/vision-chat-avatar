import { useEffect, useRef, useState } from 'react';

interface CameraCaptureProps {
  onFrameCapture?: (dataUrl: string) => void;
  captureInterval?: number; // milliseconds
  isActive: boolean;
  onStreamReady?: (stream: MediaStream) => void;
}

export default function CameraCapture({ onFrameCapture, captureInterval = 3000, isActive, onStreamReady }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera
  useEffect(() => {
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setHasPermission(true);
          setError(null);

          // Notify parent that stream is ready
          if (onStreamReady) {
            onStreamReady(stream);
          }
        }
      } catch (err) {
        console.error('Camera access error:', err);
        setHasPermission(false);
        setError('Failed to access camera. Please grant camera permissions.');
      }
    }

    initCamera();

    // Cleanup
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Capture frames at intervals
  useEffect(() => {
    if (!isActive || !hasPermission || !onFrameCapture) return;

    // Immediate capture when starting
    setTimeout(() => {
      console.log('📸 Immediate capture on start');
      captureFrame();
    }, 500); // Small delay to ensure video is ready

    const interval = setInterval(() => {
      captureFrame();
    }, captureInterval);

    return () => clearInterval(interval);
  }, [isActive, hasPermission, captureInterval, onFrameCapture]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

    if (onFrameCapture) {
      onFrameCapture(dataUrl);
    }
  };

  if (hasPermission === false) {
    return (
      <div className="card bg-red-50 border-red-300">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-auto rounded-xl border-2 border-grey-light bg-black"
        style={{ maxHeight: '400px', objectFit: 'cover' }}
      />
      <canvas ref={canvasRef} className="hidden" />
      {isActive && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-2 bg-emerald-green/90 text-white px-3 py-1 rounded-full text-sm font-semibold">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            Monitoring
          </div>
        </div>
      )}
      {!hasPermission && hasPermission !== null && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
          <p className="text-white text-sm">Camera access denied</p>
        </div>
      )}
    </div>
  );
}
