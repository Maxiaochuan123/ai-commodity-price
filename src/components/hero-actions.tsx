"use client";

import { ShieldCheck, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { WechatLink } from "./wechat-button";
import { UnlockModal } from "./price-catalog";
import { ApplyUpgradeButton } from "./apply-upgrade-button";

export function BecomeAgentModal({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!mounted) return null;

  if (showRegister) {
    return (
      <UnlockModal
        initialStep="register"
        onClose={() => {
          setShowRegister(false);
          onClose();
        }}
        onUnlockSuccess={(level) => {
          // Set local storage and trigger update
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        }}
      />
    );
  }

  return createPortal(
    <div aria-modal="true" className="modal-backdrop" role="dialog">
      <div className="agent-modal" style={{ maxWidth: "480px" }}>
        <div className="agent-modal-header">
          <div>
            <h2>成为代理</h2>
          </div>
          <button aria-label="关闭" className="modal-close" onClick={onClose} type="button">
            <X className="icon-xs" />
          </button>
        </div>

        <div className="agent-modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="agent-note">
            <ShieldCheck className="icon-sm" />
            <span>加入后可获取代理价、下单说明 and 后续合作支持。</span>
          </div>
          <p style={{ margin: "4px 0", fontSize: "16px" }}>
            <WechatLink wechat="mxcsgnh" />
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "8px 0" }}>
            <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6, color: "#1e293b" }}>
              <strong>小单量：</strong>注册成为代理即可享受 2 级别 代理价格
            </p>
            <div style={{ margin: 0, fontSize: "14px", lineHeight: 1.6, color: "#1e293b", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", width: "100%" }}>
              <span><strong>大单量：</strong>2 级代理 升级 1 级代理价更劲爆！</span>
              <ApplyUpgradeButton style={{ flexShrink: 0, marginLeft: 0 }} />
            </div>
          </div>
        </div>

        <div className="agent-modal-actions" style={{ gap: "10px" }}>
          <button 
            className="button button-accent" 
            onClick={() => setShowRegister(true)} 
            style={{ flex: 1, justifyContent: "center" }}
            type="button"
          >
            注册成为代理
          </button>
          <button 
            className="button button-secondary" 
            onClick={onClose} 
            style={{ flex: 1, justifyContent: "center" }}
            type="button"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function BecomeAgentButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="button button-accent" onClick={() => setOpen(true)} type="button">
        <Users className="icon-xs" />
        成为代理
      </button>

      {open ? <BecomeAgentModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}
