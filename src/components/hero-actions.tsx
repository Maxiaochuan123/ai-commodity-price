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
                  <p>代理费用：￥188</p>
                  <p>适合长期转售、做渠道分发、或需要稳定供货的人。</p>
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
