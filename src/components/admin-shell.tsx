"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Edit3, Eye, Power, Save, Sparkles, X } from "lucide-react";
import type { PublicPriceChangeBatch } from "@/lib/pricing";

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
  const [catalogController, setCatalogController] = useState<CatalogController | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [visitorChanges, setVisitorChanges] = useState<PublicPriceChangeBatch | null>(null);

  async function refreshAdmin() {
    const response = await fetch("/api/admin/me", { cache: "no-store" });
    const data = (await response.json()) as { isAdmin: boolean };
    setIsAdmin(data.isAdmin);
    if (!data.isAdmin) setEditMode(false);
  }

  useEffect(() => {
    setMounted(true);
    void refreshAdmin();
  }, []);

  useEffect(() => {
    if (!mounted || isAdmin) return;

    async function loadChanges() {
      const response = await fetch("/api/price-changes", { cache: "no-store" });
      const data = (await response.json()) as { changes: PublicPriceChangeBatch | null };
      if (!data.changes || data.changes.changes.length === 0) return;

      const dismissedId = window.localStorage.getItem("ai-price-dismissed-change-id");
      if (dismissedId !== data.changes.id) setVisitorChanges(data.changes);
    }

    void loadChanges();
  }, [isAdmin, mounted]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const value = useMemo<AdminContextValue>(
    () => ({
      editMode,
      isAdmin,
      openLogin: () => setLoginOpen(true),
      refreshAdmin,
      registerCatalog: setCatalogController,
      setToast
    }),
    [editMode, isAdmin]
  );

  function toggleEditMode() {
    if (editMode && catalogController?.dirty) {
      catalogController.reset();
      setToast("已放弃未保存修改");
    }
    setEditMode((current) => !current);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setConfirmLogoutOpen(false);
    setEditMode(false);
    setIsAdmin(false);
    setToast("已退出登录");
  }

  async function saveChanges() {
    setConfirmSaveOpen(false);
    await catalogController?.save();
  }

  async function resetToCodeDefaults() {
    setConfirmResetOpen(false);
    const response = await fetch("/api/admin/prices", { method: "DELETE" });
    if (response.ok) {
      setToast("已恢复代码默认价格，正在刷新...");
      window.location.reload();
    } else {
      setToast("恢复失败");
    }
  }

  function dismissVisitorChanges() {
    if (visitorChanges) {
      window.localStorage.setItem("ai-price-dismissed-change-id", visitorChanges.id);
    }
    setVisitorChanges(null);
  }

  return (
    <AdminContext.Provider value={value}>
      {children}
      {isAdmin ? (
        <div className="admin-floating-actions">
          {editMode ? (
            <button
              className="button button-danger"
              onClick={() => setConfirmResetOpen(true)}
              type="button"
            >
              恢复代码价格
            </button>
          ) : null}
          {editMode && catalogController?.dirty ? (
            <button
              className="button button-accent"
              disabled={catalogController.saving}
              onClick={() => setConfirmSaveOpen(true)}
              type="button"
            >
              <Save className="icon-xs" />
              {catalogController.saving ? "保存中" : "保存修改"}
            </button>
          ) : null}
          <button className="button button-secondary" onClick={toggleEditMode} type="button">
            {editMode ? <Eye className="icon-xs" /> : <Edit3 className="icon-xs" />}
            {editMode ? "退出编辑" : "进入编辑"}
          </button>
          <button aria-label="退出登录" className="button button-danger-icon" onClick={() => setConfirmLogoutOpen(true)} type="button">
            <Power className="icon-xs" />
          </button>
        </div>
      ) : null}
      {mounted && loginOpen ? <LoginModal onClose={() => setLoginOpen(false)} onLoggedIn={() => setIsAdmin(true)} /> : null}
      {mounted && confirmSaveOpen ? (
        <ConfirmModal
          confirmText="确认保存"
          message="保存后，零售或代理价格的变化会对访客生效，并在访客首次访问时展示价格更新提醒。"
          onCancel={() => setConfirmSaveOpen(false)}
          onConfirm={() => void saveChanges()}
          title="确认保存修改？"
        />
      ) : null}
      {mounted && confirmResetOpen ? (
        <ConfirmModal
          confirmClassName="button button-danger"
          confirmText="确认恢复"
          message="确认删除所有已保存的价格，并恢复到代码中定义的初始默认价格吗？此操作将立即刷新页面。"
          onCancel={() => setConfirmResetOpen(false)}
          onConfirm={() => void resetToCodeDefaults()}
          title="确认恢复代码默认价格？"
        />
      ) : null}
      {mounted && confirmLogoutOpen ? (
        <ConfirmModal
          confirmClassName="button button-danger"
          confirmText="退出登录"
          message="退出后将离开管理员状态，需要重新登录才能查看成本、利润和编辑价格。"
          onCancel={() => setConfirmLogoutOpen(false)}
          onConfirm={() => void logout()}
          title="确认退出登录？"
        />
      ) : null}
      {mounted && visitorChanges ? <VisitorChangeModal changes={visitorChanges} onClose={dismissVisitorChanges} /> : null}
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

function VisitorChangeModal({ changes, onClose }: { changes: PublicPriceChangeBatch; onClose: () => void }) {
  return createPortal(
    <div aria-modal="true" className="modal-backdrop" role="dialog">
      <div className="agent-modal price-change-modal">
        <div className="agent-modal-header">
          <div>
            <h2>价格更新提醒</h2>
            <p>以下商品价格较上次有变化，请下单前留意。</p>
          </div>
          <button aria-label="关闭" className="modal-close" onClick={onClose} type="button">
            <X className="icon-xs" />
          </button>
        </div>

        <div className="agent-modal-body price-change-list">
          {changes.changes.map((change) => (
            <article className="price-change-item" key={change.productId}>
              <strong>{change.productName}</strong>
              <span>{change.subgroupName ? `${change.groupName} / ${change.subgroupName}` : change.groupName}</span>
              {change.retail ? (
                <p>
                  零售：¥{formatPrice(change.retail.from)} → ¥{formatPrice(change.retail.to)}
                </p>
              ) : null}
              {change.agent ? (
                <p>
                  代理返现：¥{formatPrice(change.agent.from)} → ¥{formatPrice(change.agent.to)}
                </p>
              ) : null}
            </article>
          ))}
        </div>

        <div className="agent-modal-actions">
          <button className="button button-secondary" onClick={onClose} type="button">
            我知道了
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(price);
}
