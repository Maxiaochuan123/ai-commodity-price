"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { UpgradeToPrimaryModal } from "./price-catalog";

export function ApplyUpgradeButton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    
    if (typeof window !== "undefined") {
      const level = localStorage.getItem("agent_unlocked_level");
      if (level === "secondary" || level === "primary") {
        setOpen(true);
      } else {
        setShowWarning(true);
      }
    } else {
      setShowWarning(true);
    }
  }

  return (
    <>
      <button
        className={className || "button button-secondary"}
        onClick={handleClick}
        style={{
          minHeight: "unset",
          height: "28px",
          padding: "0 10px",
          fontSize: "12px",
          fontWeight: 700,
          borderRadius: "6px",
          border: "1px solid rgba(15, 118, 110, 0.3)",
          background: "transparent",
          color: "#0f766e",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          marginLeft: "8px",
          ...style
        }}
        type="button"
      >
        立即申请！
      </button>

      {open ? <UpgradeToPrimaryModal onClose={() => setOpen(false)} /> : null}

      {showWarning
        ? createPortal(
            <div aria-modal="true" className="modal-backdrop" role="dialog" style={{ zIndex: 9999 }}>
              <div className="agent-modal login-modal" style={{ maxWidth: "360px" }}>
                <div className="agent-modal-header">
                  <div>
                    <h2>提示</h2>
                  </div>
                  <button aria-label="关闭" className="modal-close" onClick={() => setShowWarning(false)} type="button">
                    <X className="icon-xs" />
                  </button>
                </div>
                <div className="agent-modal-body" style={{ padding: "20px 24px" }}>
                  <p style={{ margin: 0, fontSize: "15px", color: "#334155", lineHeight: 1.6, textAlign: "center" }}>
                    请先注册成为 2 级代理 才可升级
                  </p>
                </div>
                <div className="agent-modal-actions" style={{ justifyContent: "center" }}>
                  <button 
                    className="button button-primary" 
                    onClick={() => setShowWarning(false)} 
                    style={{ minWidth: "120px", justifyContent: "center" }}
                    type="button"
                  >
                    我知道了
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
