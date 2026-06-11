"use client";

import { useEffect, useRef } from "react";
import lottie from "lottie-web";

interface LottiePlayerProps {
  animationPath: string;
  loop?: boolean;
  autoplay?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export function LottiePlayer({
  animationPath,
  loop = false,
  autoplay = true,
  style,
  className
}: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop,
      autoplay,
      path: animationPath
    });

    return () => {
      anim.destroy();
    };
  }, [animationPath, loop, autoplay]);

  return <div ref={containerRef} style={style} className={className} />;
}
