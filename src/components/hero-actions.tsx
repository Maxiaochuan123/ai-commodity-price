"use client";

import { ShieldCheck, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function BecomeAgentButton() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button className="button button-accent" onClick={() => setOpen(true)} type="button">
        <Users className="icon-xs" />
        成为代理
      </button>

      {mounted && open
        ? createPortal(
            <div aria-modal="true" className="modal-backdrop" role="dialog">
              <div className="agent-modal">
                <div className="agent-modal-header">
                  <div>
                    <h2>成为代理</h2>
                  </div>
                  <button aria-label="关闭" className="modal-close" onClick={() => setOpen(false)} type="button">
                    <X className="icon-xs" />
                  </button>
                </div>

                <div className="agent-modal-body">
                  <div className="agent-note">
                    <ShieldCheck className="icon-sm" />
                    <span>加入后可获取代理价、下单说明和后续合作支持。</span>
                  </div>
                  <p>联系微信：mxcsgnh</p>
                  <p>主播/代理 合作：小单量直接参考 代理返现 (每单)</p>
                  <p>大单量：＋ 微信详谈</p>
                </div>

                <div className="agent-modal-actions">
                  <button className="button button-secondary" onClick={() => setOpen(false)} type="button">
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
