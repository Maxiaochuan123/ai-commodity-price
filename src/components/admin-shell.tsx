"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Edit3, Eye, Power, Sparkles, Users, X } from "lucide-react";
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
  const [newAgentCount, setNewAgentCount] = useState(0);

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

        <div className="agent-modal-actions">
          <button className="button button-primary" disabled={loading} type="submit">
            {loading ? "登录中" : "登录"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}


