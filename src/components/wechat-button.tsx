"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type CopyState = "idle" | "copied" | "failed";

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy copy path.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    document.body.removeChild(textarea);
  }

  return copied;
}

export function WechatButton({ wechat }: { wechat: string }) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const launchTimerRef = useRef<number | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (launchTimerRef.current) window.clearTimeout(launchTimerRef.current);
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    };
  }, []);

  async function handleClick() {
    if (launchTimerRef.current) window.clearTimeout(launchTimerRef.current);
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);

    const copied = await copyText(wechat);
    setCopyState(copied ? "copied" : "failed");

    launchTimerRef.current = window.setTimeout(() => {
      window.location.href = "weixin://";
      setCopyState("idle");
    }, 500);

    if (!copied) {
      resetTimerRef.current = window.setTimeout(() => {
        setCopyState("idle");
      }, 500);
    }
  }

  return (
    <button
      className={copyState === "copied" ? "button button-primary wechat-button is-success" : "button button-primary wechat-button"}
      onClick={handleClick}
      type="button"
    >
      <svg aria-hidden="true" className="wechat-icon" viewBox="0 0 32 28">
        <path d="M12.6 2.4C6.7 2.4 2 6.2 2 11c0 2.7 1.5 5.1 3.9 6.7l-.8 2.8 3.2-1.6c1.3.4 2.7.7 4.3.7 5.9 0 10.6-3.9 10.6-8.6S18.5 2.4 12.6 2.4Z" />
        <path d="M20.5 10.2c5.3 0 9.5 3.4 9.5 7.6 0 2.3-1.2 4.3-3.2 5.7l.7 2.5-2.9-1.4c-1.2.4-2.6.6-4.1.6-5.3 0-9.5-3.4-9.5-7.5s4.2-7.5 9.5-7.5Z" />
        <circle cx="8.8" cy="9.8" r="1.2" />
        <circle cx="16.4" cy="9.8" r="1.2" />
        <circle cx="17.5" cy="16.9" r="1" />
        <circle cx="24.1" cy="16.9" r="1" />
      </svg>
      {copyState === "copied" ? "已复制到剪切板" : copyState === "failed" ? "复制失败，正在打开微信" : `微信：${wechat}`}
    </button>
  );
}

export function WechatLink({ wechat }: { wechat: string }) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const launchTimerRef = useRef<number | null>(null);
  const resetTimerRef = useRef<number | null>(null);
  const [hoveredTooltip, setHoveredTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    return () => {
      if (launchTimerRef.current) window.clearTimeout(launchTimerRef.current);
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    };
  }, []);

  async function handleClick() {
    if (launchTimerRef.current) window.clearTimeout(launchTimerRef.current);
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);

    const copied = await copyText(wechat);
    setCopyState(copied ? "copied" : "failed");

    launchTimerRef.current = window.setTimeout(() => {
      window.location.href = "weixin://";
      setCopyState("idle");
    }, 500);

    if (!copied) {
      resetTimerRef.current = window.setTimeout(() => {
        setCopyState("idle");
      }, 500);
    }
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
      联系微信：
      <span
        onClick={handleClick}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          color: "#0f766e",
          fontWeight: 700,
          cursor: "pointer",
          transition: "color 150ms ease"
        }}
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setHoveredTooltip({
            text: "点击复制微信并打开微信",
            x: rect.left + rect.width / 2,
            y: rect.top - 8
          });
        }}
        onMouseLeave={() => setHoveredTooltip(null)}
      >
        <svg 
          aria-hidden="true" 
          className="wechat-icon" 
          style={{ 
            width: "18px", 
            height: "16px"
          }} 
          viewBox="0 0 32 28"
        >
          <path d="M12.6 2.4C6.7 2.4 2 6.2 2 11c0 2.7 1.5 5.1 3.9 6.7l-.8 2.8 3.2-1.6c1.3.4 2.7.7 4.3.7 5.9 0 10.6-3.9 10.6-8.6S18.5 2.4 12.6 2.4Z" />
          <path d="M20.5 10.2c5.3 0 9.5 3.4 9.5 7.6 0 2.3-1.2 4.3-3.2 5.7l.7 2.5-2.9-1.4c-1.2.4-2.6.6-4.1.6-5.3 0-9.5-3.4-9.5-7.5s4.2-7.5 9.5-7.5Z" />
          <circle cx="8.8" cy="9.8" r="1.2" />
          <circle cx="16.4" cy="9.8" r="1.2" />
          <circle cx="17.5" cy="16.9" r="1" />
          <circle cx="24.1" cy="16.9" r="1" />
        </svg>
        <span>
          {copyState === "copied" ? "已复制！" : copyState === "failed" ? "复制失败" : wechat}
        </span>
      </span>
      {hoveredTooltip && createPortal(
        <div style={{
          position: "fixed",
          left: `${hoveredTooltip.x}px`,
          top: `${hoveredTooltip.y}px`,
          transform: "translate(-50%, -100%)",
          background: "#1e293b",
          color: "#fff",
          padding: "6px 10px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: 500,
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
          pointerEvents: "none",
          zIndex: 99999,
          maxWidth: "280px",
          lineHeight: 1.4,
          textAlign: "center",
          whiteSpace: "normal"
        }}>
          {hoveredTooltip.text}
          <div style={{
            position: "absolute",
            left: "50%",
            bottom: "0",
            transform: "translate(-50%, 100%)",
            width: "0",
            height: "0",
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid #1e293b"
          }} />
        </div>,
        document.body
      )}
    </span>
  );
}
