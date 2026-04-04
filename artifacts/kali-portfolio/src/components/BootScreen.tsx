import { motion } from "framer-motion";
import bootVideo from "@assets/boot_1775198015682.mp4";

interface BootScreenProps {
  onComplete: () => void;
}

export default function BootScreen({ onComplete }: BootScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 select-none"
      style={{ background: "#000000", zIndex: 50 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <video
        src={bootVideo}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={() => onComplete()}
        onError={() => onComplete()}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          background: "#000000",
          display: "block",
        }}
      />
    </motion.div>
  );
}
