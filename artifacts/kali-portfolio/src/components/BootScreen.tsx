import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import bootVideo from "@assets/Kali-linux-2019-boot-up-animation_1775177532779.mp4";

interface BootScreenProps {
  onComplete: () => void;
}

export default function BootScreen({ onComplete }: BootScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      onComplete();
    };

    video.addEventListener("ended", handleEnded);

    video.play().catch(() => {
      setTimeout(onComplete, 5000);
    });

    return () => {
      video.removeEventListener("ended", handleEnded);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 bg-black z-50 select-none overflow-hidden"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <video
        ref={videoRef}
        src={bootVideo}
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
        preload="auto"
      />

      <button
        onClick={onComplete}
        className="absolute bottom-5 right-6 text-xs text-white/40 hover:text-white/80 font-mono tracking-widest uppercase transition-colors duration-200 focus:outline-none bg-black/30 px-3 py-1 border border-white/10"
      >
        Skip
      </button>
    </motion.div>
  );
}
