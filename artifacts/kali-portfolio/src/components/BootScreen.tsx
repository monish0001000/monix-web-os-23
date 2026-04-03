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

    video.play().catch(() => {});

    return () => {};
  }, []);

  return (
    <motion.div
      className="fixed inset-0 select-none"
      style={{ background: "#000000", zIndex: 50 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <video
        ref={videoRef}
        src={bootVideo}
        onEnded={onComplete}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          background: "#000000",
          display: "block",
        }}
        autoPlay
        muted
        playsInline
        preload="auto"
      />
    </motion.div>
  );
}
