import React, { useLayoutEffect, useRef, useState } from "react";

interface FitToViewportProps {
  width: number;
  height: number;
  children: React.ReactNode;
}

// Screens are authored at fixed design sizes; scale them uniformly to fit the available box.
export function FitToViewport({ width, height, children }: FitToViewportProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const update = () => {
      const { clientWidth, clientHeight } = box;
      setScale(Math.min(clientWidth / width, clientHeight / height, 1));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(box);
    return () => observer.disconnect();
  }, [width, height]);

  return (
    <div
      ref={boxRef}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{ width: width * scale, height: height * scale, flexShrink: 0 }}
      >
        <div
          style={{
            width,
            height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
