import { INK, PAGE_BG, lilita, nunito } from "../design";
import { VeggieBackground } from "../VeggieBackground";

export const VEGGIE_SIZES_CANVAS = { width: 2560, height: 900 };

const FRAMES = [
  {
    label: "1920 × 1080",
    width: 1920,
    height: 1080,
    scale: 0.6,
    safe: { x: 28, y: 25 },
  },
  {
    label: "1366 × 768",
    width: 1366,
    height: 768,
    scale: 0.6,
    safe: { x: 28, y: 25 },
  },
  {
    label: "390 × 844 (phone)",
    width: 390,
    height: 844,
    scale: 0.75,
    safe: { x: 16, y: 20 },
  },
];

/** Dev preview: VeggieBackground at real screen sizes, with the center content area outlined. */
export function VeggieBackgroundSizes() {
  return (
    <div
      style={{
        width: VEGGIE_SIZES_CANVAS.width,
        height: VEGGIE_SIZES_CANVAS.height,
        boxSizing: "border-box",
        padding: "40px 60px",
        background: PAGE_BG,
        color: INK,
        fontFamily: "Nunito, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: 30,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
        <span style={{ font: lilita(48) }}>Veggie background · sizes</span>
        <span style={{ font: nunito(800, 20) }}>
          Dashed box = main content area; clusters should stay outside it.
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 60 }}>
        {FRAMES.map((f) => (
          <div
            key={f.label}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div
              style={{
                width: f.width * f.scale,
                height: f.height * f.scale,
                border: `4px solid ${INK}`,
                borderRadius: 16,
                overflow: "hidden",
                boxSizing: "content-box",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: f.width,
                  height: f.height,
                  transform: `scale(${f.scale})`,
                  transformOrigin: "top left",
                }}
              >
                <VeggieBackground parallax={false} />
                <div
                  style={{
                    position: "absolute",
                    left: `${f.safe.x}%`,
                    right: `${f.safe.x}%`,
                    top: `${f.safe.y}%`,
                    bottom: `${f.safe.y}%`,
                    border: `6px dashed ${INK}`,
                    borderRadius: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    font: lilita(f.width > 1000 ? 56 : 32),
                    opacity: 0.55,
                  }}
                >
                  main content
                </div>
              </div>
            </div>
            <span style={{ font: nunito(900, 22) }}>{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
