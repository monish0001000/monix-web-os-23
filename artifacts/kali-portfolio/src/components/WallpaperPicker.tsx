import WindowChrome from "./WindowChrome";
import { useOSStore, DEFAULT_WALLPAPER } from "@/lib/store";

interface WallpaperPickerProps {
  onClose: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

export default function WallpaperPicker({ onClose, isActive, onFocus, initialX, initialY, zIndex }: WallpaperPickerProps) {
  const { wallpapers, currentWallpaper, setWallpaper, resetWallpaper } = useOSStore();

  return (
    <WindowChrome
      title="Wallpaper Picker"
      onClose={onClose}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={540}
      height={420}
      zIndex={zIndex}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0f0f14",
          padding: 16,
          boxSizing: "border-box",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontFamily: "'Ubuntu', sans-serif",
          }}
        >
          Select a wallpaper — {wallpapers.length} available
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }}
        >
          {wallpapers.map((wp, i) => {
            const isSelected = currentWallpaper === wp;
            return (
              <div
                key={i}
                onClick={() => setWallpaper(wp)}
                title={`Wallpaper ${i + 1}`}
                style={{
                  position: "relative",
                  aspectRatio: "16/9",
                  borderRadius: 5,
                  overflow: "hidden",
                  cursor: "pointer",
                  border: isSelected
                    ? "2px solid #367BF0"
                    : "2px solid rgba(255,255,255,0.07)",
                  boxShadow: isSelected
                    ? "0 0 0 1px rgba(54,123,240,0.4), 0 4px 16px rgba(0,0,0,0.6)"
                    : "0 2px 8px rgba(0,0,0,0.5)",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${wp})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "scale(1.04)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                  }}
                />

                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      background: "#367BF0",
                      borderRadius: "50%",
                      width: 18,
                      height: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                    }}
                  >
                    <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}

                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "4px 8px",
                    background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: "'Ubuntu', sans-serif",
                  }}
                >
                  Wallpaper {i + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* Set to Default button */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 2 }}>
          <button
            onClick={() => resetWallpaper()}
            disabled={currentWallpaper === DEFAULT_WALLPAPER}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 22px",
              background: currentWallpaper === DEFAULT_WALLPAPER
                ? "rgba(255,255,255,0.04)"
                : "rgba(54,123,240,0.12)",
              border: currentWallpaper === DEFAULT_WALLPAPER
                ? "1px solid rgba(255,255,255,0.08)"
                : "1px solid rgba(54,123,240,0.35)",
              borderRadius: 6,
              cursor: currentWallpaper === DEFAULT_WALLPAPER ? "default" : "pointer",
              fontSize: 12,
              fontFamily: "'Ubuntu', sans-serif",
              color: currentWallpaper === DEFAULT_WALLPAPER
                ? "rgba(255,255,255,0.25)"
                : "rgba(144,191,255,0.9)",
              transition: "all 0.15s",
              letterSpacing: "0.02em",
            }}
            onMouseEnter={(e) => {
              if (currentWallpaper !== DEFAULT_WALLPAPER) {
                (e.currentTarget as HTMLElement).style.background = "rgba(54,123,240,0.22)";
              }
            }}
            onMouseLeave={(e) => {
              if (currentWallpaper !== DEFAULT_WALLPAPER) {
                (e.currentTarget as HTMLElement).style.background = "rgba(54,123,240,0.12)";
              }
            }}
          >
            <svg viewBox="0 0 14 14" width="13" height="13" fill="none">
              <path d="M7 1.5A5.5 5.5 0 1 0 12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 1h3.5V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Set to Default
          </button>
        </div>
      </div>
    </WindowChrome>
  );
}
