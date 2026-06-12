"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Bell, Edit3, Eye, Power, Sparkles, Users, X } from "lucide-react";
import { AgentManagement } from "@/components/agent-management";

type AdminContextValue = {
  editMode: boolean;
  isAdmin: boolean;
  openLogin: () => void;
  registerCatalog: (controller: CatalogController | null) => void;
  refreshAdmin: () => Promise<void>;
  setToast: (message: string) => void;
};

type CatalogController = {
  dirty: boolean;
  reset: () => void;
  save: () => Promise<void>;
  saving: boolean;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [agentMgmtOpen, setAgentMgmtOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [newAgentCount, setNewAgentCount] = useState(0);
  const hasRefreshedRef = useRef(false);

  async function refreshAdmin() {
    const response = await fetch("/api/admin/me", { cache: "no-store" });
    const data = (await response.json()) as { isAdmin: boolean };
    setIsAdmin(data.isAdmin);
  }

  const fetchNotifications = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await fetch("/api/agents/notifications", { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as { count: number };
        setNewAgentCount(data.count);
      }
    } catch {
      // ignore
    }
  }, [isAdmin]);

  useEffect(() => {
    setMounted(true);
    if (hasRefreshedRef.current) return;
    hasRefreshedRef.current = true;
    void refreshAdmin();
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const value = useMemo<AdminContextValue>(
    () => ({
      editMode: false,
      isAdmin,
      openLogin: () => setLoginOpen(true),
      refreshAdmin,
      registerCatalog: () => {},
      setToast
    }),
    [isAdmin]
  );

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setConfirmLogoutOpen(false);
    setIsAdmin(false);
    setToast("已退出登录");
  }

  return (
    <AdminContext.Provider value={value}>
      {children}
      {isAdmin ? (
        <div className="admin-floating-actions">
          <button
            aria-label="公告设置"
            className="button button-accent agent-mgmt-button"
            onClick={() => setAnnouncementOpen(true)}
            type="button"
          >
            <Bell className="icon-xs" />
            <span>公告设置</span>
          </button>
          <button
            aria-label="代理管理"
            className="button button-accent agent-mgmt-button"
            onClick={() => setAgentMgmtOpen(true)}
            type="button"
          >
            <Users className="icon-xs" />
            <span>代理管理</span>
            {newAgentCount > 0 ? (
              <span className="notification-badge">{newAgentCount > 99 ? "99+" : newAgentCount}</span>
            ) : null}
          </button>
          <button aria-label="退出登录" className="button button-danger-icon" onClick={() => setConfirmLogoutOpen(true)} type="button">
            <Power className="icon-xs" />
          </button>
        </div>
      ) : null}
      {mounted && loginOpen ? <LoginModal onClose={() => setLoginOpen(false)} onLoggedIn={() => setIsAdmin(true)} /> : null}
      {mounted && confirmLogoutOpen ? (
        <ConfirmModal
          confirmClassName="button button-danger"
          confirmText="退出登录"
          message="退出后将离开管理员状态，需要重新登录才能查看成本和零售利润。"
          onCancel={() => setConfirmLogoutOpen(false)}
          onConfirm={() => void logout()}
          title="确认退出登录？"
        />
      ) : null}
      {mounted && agentMgmtOpen ? (
        <AgentManagement
          onClose={() => setAgentMgmtOpen(false)}
          onNotificationsClear={() => setNewAgentCount(0)}
        />
      ) : null}
      {mounted && announcementOpen ? (
        <AnnouncementSettingsModal onClose={() => setAnnouncementOpen(false)} />
      ) : null}
      {mounted && toast ? createPortal(<div className="site-toast">{toast}</div>, document.body) : null}
    </AdminContext.Provider>
  );
}

function ConfirmModal({
  confirmClassName = "button button-primary",
  confirmText,
  message,
  onCancel,
  onConfirm,
  title
}: {
  confirmClassName?: string;
  confirmText: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}) {
  return createPortal(
    <div aria-modal="true" className="modal-backdrop" role="dialog">
      <div className="agent-modal confirm-modal">
        <div className="agent-modal-header">
          <div>
            <h2>{title}</h2>
            <p>{message}</p>
          </div>
          <button aria-label="关闭" className="modal-close" onClick={onCancel} type="button">
            <X className="icon-xs" />
          </button>
        </div>

        <div className="agent-modal-actions">
          <button className="button button-secondary" onClick={onCancel} type="button">
            取消
          </button>
          <button className={confirmClassName} onClick={onConfirm} type="button">
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function BrandLoginButton() {
  const admin = useAdmin();

  return (
    <button className="brand-mark brand-button" onClick={admin.openLogin} type="button">
      <Sparkles className="icon-sm" />
      老马杂货铺
    </button>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used inside AdminProvider");
  return context;
}

function LoginModal({ onClose, onLoggedIn }: { onClose: () => void; onLoggedIn: () => void }) {
  const admin = useAdmin();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      body: JSON.stringify({ password, username }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });

    setLoading(false);

    if (!response.ok) {
      setError("账号或密码错误");
      return;
    }

    await admin.refreshAdmin();
    onLoggedIn();
    onClose();
    admin.setToast("已进入管理员模式");
  }

  return createPortal(
    <div aria-modal="true" className="modal-backdrop" role="dialog">
      <form className="agent-modal login-modal" onSubmit={(event) => void submit(event)}>
        <div className="agent-modal-header">
          <div>
            <h2>管理员登录</h2>
            <p>登录后可查看成本、利润并修改价格。</p>
          </div>
          <button aria-label="关闭" className="modal-close" onClick={onClose} type="button">
            <X className="icon-xs" />
          </button>
        </div>

        <div className="agent-modal-body login-form">
          <label>
            账号
            <input autoComplete="username" onChange={(event) => setUsername(event.target.value)} value={username} />
          </label>
          <label>
            密码
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
        </div>

        <div className="agent-modal-actions" style={{ padding: "16px 24px" }}>
          <button className="button button-primary" disabled={loading} type="submit" style={{ width: "100%", justifyContent: "center" }}>
            {loading ? "登录中..." : "登录"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

function AnnouncementSettingsModal({ onClose }: { onClose: () => void }) {
  const admin = useAdmin();
  const [guest, setGuest] = useState("");
  const [agent, setAgent] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch("/api/admin/announcements")
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as { announcements: { guest: string; agent: string } };
          setGuest(data.announcements.guest || "");
          setAgent(data.announcements.agent || "");
        }
      })
      .finally(() => {
        setFetching(false);
      });
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest, agent }),
      });
      if (res.ok) {
        admin.setToast("公告保存成功");
        onClose();
      } else {
        admin.setToast("保存失败");
      }
    } catch {
      admin.setToast("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div aria-modal="true" className="modal-backdrop" role="dialog">
      <form className="agent-modal login-modal" onSubmit={(e) => void handleSubmit(e)} style={{ maxWidth: "480px" }}>
        <div className="agent-modal-header" style={{ padding: "18px 24px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700 }}>公告配置</h2>
            <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>配置分别向游客和代理商展示的弹窗公告</p>
          </div>
          <button aria-label="关闭" className="modal-close" onClick={onClose} type="button">
            <X className="icon-xs" />
          </button>
        </div>

        <div className="agent-modal-body" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {fetching ? (
            <div style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>加载中...</div>
          ) : (
            <>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13.5px", fontWeight: 600, color: "#334155" }}>
                游客公告
                <p style={{ margin: 0, fontSize: "11px", color: "#64748b", fontWeight: 400 }}>普通游客未登录时进站展示的弹窗，留空则不展示。</p>
                <textarea
                  value={guest}
                  onChange={(e) => setGuest(e.target.value)}
                  placeholder="请输入游客公告内容，支持换行..."
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontFamily: "inherit",
                    fontWeight: 400,
                    outline: "none",
                    resize: "none",
                    boxSizing: "border-box",
                    marginTop: "4px"
                  }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13.5px", fontWeight: 600, color: "#334155" }}>
                代理公告
                <p style={{ margin: 0, fontSize: "11px", color: "#64748b", fontWeight: 400 }}>1级或2级代理登录进站后展示的弹窗，留空则不展示。</p>
                <textarea
                  value={agent}
                  onChange={(e) => setAgent(e.target.value)}
                  placeholder="请输入代理商公告内容，支持换行..."
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontFamily: "inherit",
                    fontWeight: 400,
                    outline: "none",
                    resize: "none",
                    boxSizing: "border-box",
                    marginTop: "4px"
                  }}
                />
              </label>
            </>
          )}
        </div>

        <div className="agent-modal-actions" style={{ padding: "16px 24px" }}>
          <button className="button button-secondary" onClick={onClose} type="button" style={{ flex: 1 }}>
            取消
          </button>
          <button className="button button-primary" disabled={loading || fetching} type="submit" style={{ flex: 1 }}>
            {loading ? "保存中..." : "保存"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}


