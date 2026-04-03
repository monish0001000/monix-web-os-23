import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import bootVideo from "@assets/boot_1775198015682.mp4";

interface BootScreenProps {
  onComplete: () => void;
}

export default function BootScreen({ onComplete }: BootScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const fallback = setTimeout(() => {
      onComplete();
    }, 6000);

    const handleEnded = () => {
      clearTimeout(fallback);
      onComplete();
    };

    const handleError = () => {
      clearTimeout(fallback);
      onComplete();
    };

    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        clearTimeout(fallback);
        onComplete();
      });
    }

    return () => {
      clearTimeout(fallback);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 select-none"
      style={{ background: "#000000", zIndex: 50 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <video
        ref={videoRef}
        src={bootVideo}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          background: "#000000",
          display: "block",
        }}
        muted
        playsInline
        preload="auto"
      />
    </motion.div>
  );
}
