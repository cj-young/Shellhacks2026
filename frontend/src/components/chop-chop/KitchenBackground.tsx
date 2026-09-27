/**
 * Full-bleed kitchen illustration behind the host screens. `blurred` is the
 * soft-focus version used behind the round-end leaderboard.
 */
export function KitchenBackground({ blurred = false }: { blurred?: boolean }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        backgroundColor: "#EADCC0",
        backgroundImage: `url(/assets/${
          blurred ? "kitchen-background-blur.webp" : "kitchen-background.jpg"
        })`,
        backgroundSize: "cover",
        backgroundPosition: "center bottom",
      }}
    />
  );
}
