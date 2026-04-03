import WindowChrome from "./WindowChrome";
import { useOSStore } from "@/lib/store";

interface WallpaperPickerProps {
  onClose: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

export default function WallpaperPicker({ onClose, isActive, onFocus, initialX, initialY, zIndex }: WallpaperPickerProps) {
  const { wallpapers, currentWallpaper, defaultWallpaper, setWallpaper, setDefaultWallpaper, resetWallpaper } = useOSStore();

  const isCurrentDefault = currentWallpaper === defaultWallpaper;

  return (
    <WindowChrome
      title="Wallpaper & Appearance"
      onClose={onClose}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={560}
      height={460}
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
          fontFamily: "'Ubuntu', sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {wallpapers.length} wallpapers available
          </div>
          {defaultWallpaper && (
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#367BF0" }} />
              Default: Wallpaper {wallpapers.indexOf(defaultWallpaper) + 1}
            </div>
          )}
        </div>

        {/* Thumbnail grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }}
        >
          {wallpapers.map((wp, i) => {
            const isSelected = currentWallpaper === wp;
            const isDefault = defaultWallpaper === wp;
            return (
              <div
                key={i}
                onClick={() => setWallpaper(wp)}
                title={`Wallpaper ${i + 1}${isDefault ? " (System Default)" : ""}`}
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

                {/* Selected checkmark */}
                {isSelected && (
                  <div style={{
                    position: "absolute", top: 6, right: 6,
                    background: "#367BF0", borderRadius: "50%",
                    width: 18, height: 18,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                  }}>
                    <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}

                {/* Default star badge */}
                {isDefault && (
                  <div style={{
                    position: "absolute", top: 6, left: 6,
                    background: "rgba(250,200,50,0.9)", borderRadius: 3,
                    padding: "1px 5px", fontSize: 8, fontWeight: 700,
                    color: "#000", letterSpacing: "0.04em",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
                  }}>
                    DEFAULT
                  </div>
                )}

                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  padding: "4px 8px",
                  background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                  fontSize: 10, color: "rgba(255,255,255,0.7)",
                }}>
                  Wallpaper {i + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10, paddingTop: 2 }}>

          {/* Set as System Default */}
          <button
            onClick={() => setDefaultWallpaper(currentWallpaper)}
            disabled={isCurrentDefault}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 18px",
              background: isCurrentDefault ? "rgba(255,255,255,0.04)" : "rgba(250,200,50,0.1)",
              border: isCurrentDefault ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(250,200,50,0.35)",
              borderRadius: 6, cursor: isCurrentDefault ? "default" : "pointer",
              fontSize: 12, fontFamily: "'Ubuntu', sans-serif",
              color: isCurrentDefault ? "rgba(255,255,255,0.2)" : "rgba(250,210,80,0.9)",
              transition: "all 0.15s", letterSpacing: "0.02em",
            }}
            onMouseEnter={(e) => {
              if (!isCurrentDefault) (e.currentTarget as HTMLElement).style.background = "rgba(250,200,50,0.18)";
            }}
            onMouseLeave={(e) => {
              if (!isCurrentDefault) (e.currentTarget as HTMLElement).style.background = "rgba(250,200,50,0.1)";
            }}
          >
            <svg viewBox="0 0 14 14" width="12" height="12" fill="none">
              <path d="M7 1l1.6 3.3 3.6.5-2.6 2.5.6 3.6L7 9.2 3.8 11l.6-3.6L2 4.8l3.6-.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
            Set as System Default
          </button>

          {/* Restore Default */}
          <button
            onClick={() => resetWallpaper()}
            disabled={isCurrentDefault}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 18px",
              background: isCurrentDefault ? "rgba(255,255,255,0.04)" : "rgba(54,123,240,0.12)",
              border: isCurrentDefault ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(54,123,240,0.35)",
              borderRadius: 6, cursor: isCurrentDefault ? "default" : "pointer",
              fontSize: 12, fontFamily: "'Ubuntu', sans-serif",
              color: isCurrentDefault ? "rgba(255,255,255,0.2)" : "rgba(144,191,255,0.9)",
              transition: "all 0.15s", letterSpacing: "0.02em",
            }}
            onMouseEnter={(e) => {
              if (!isCurrentDefault) (e.currentTarget as HTMLElement).style.background = "rgba(54,123,240,0.22)";
            }}
            onMouseLeave={(e) => {
              if (!isCurrentDefault) (e.currentTarget as HTMLElement).style.background = "rgba(54,123,240,0.12)";
            }}
          >
            <svg viewBox="0 0 14 14" width="12" height="12" fill="none">
              <path d="M7 1.5A5.5 5.5 0 1 0 12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 1h3.5V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Restore Default
          </button>
        </div>
      </div>
    </WindowChrome>
  );
}
