"use client";

import { Edit3, Search, UserPlus, X } from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Agent } from "@/app/api/agents/route";

type AgentManagementProps = {
  onClose: () => void;
  onNotificationsClear: () => void;
};

export function AgentManagement({ onClose, onNotificationsClear }: AgentManagementProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/agents", { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as { agents: Agent[] };
        setAgents(data.agents);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAgents();
    // Clear notifications when opening management page
    void fetch("/api/agents/notifications", { method: "PUT" });
    onNotificationsClear();
  }, [fetchAgents, onNotificationsClear]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const filteredAgents = agents.filter((agent) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      agent.wechatId.toLowerCase().includes(query) ||
      agent.name.toLowerCase().includes(query)
    );
  });

  const isNewAgent = (createdAt: number) => {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    return Date.now() - createdAt < ONE_DAY;
  };

  return createPortal(
    <div aria-modal="true" className="modal-backdrop" role="dialog">
      <div className="agent-modal agent-management-modal">
        <div className="agent-modal-header">
          <div>
            <h2>代理管理</h2>
            <p>管理所有注册的代理</p>
          </div>
          <button aria-label="关闭" className="modal-close" onClick={onClose} type="button">
            <X className="icon-xs" />
          </button>
        </div>

        <div className="agent-modal-body agent-management-body">
          <div className="agent-search-bar">
            <div className="agent-search-input-wrap">
              <Search className="icon-xs" style={{ color: "#94a3b8", flexShrink: 0 }} />
              <input
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索微信号或姓名..."
                type="text"
                value={searchQuery}
              />
            </div>
            <span className="agent-count-badge">
              共 {agents.length} 位代理
            </span>
          </div>

          {loading ? (
            <div className="agent-empty-state">加载中...</div>
          ) : filteredAgents.length === 0 ? (
            <div className="agent-empty-state">
              {agents.length === 0 ? (
                <>
                  <UserPlus style={{ width: 32, height: 32, color: "#94a3b8" }} />
                  <p>暂无注册代理</p>
                </>
              ) : (
                <p>未找到匹配的代理</p>
              )}
            </div>
          ) : (
            <div className="agent-list">
              {filteredAgents.map((agent) => (
                <div
                  className={`agent-list-item ${isNewAgent(agent.createdAt) ? "is-new" : ""}`}
                  key={agent.wechatId}
                >
                  <div className="agent-list-item-info">
                    <div className="agent-list-item-header">
                      <span className="agent-list-name">{agent.name || "未设置姓名"}</span>
                      <span className={`agent-level-badge ${agent.level === 1 ? "is-primary" : "is-secondary"}`}>
                        {agent.level === 1 ? "1 级代理" : "2 级代理"}
                      </span>
                      {isNewAgent(agent.createdAt) ? (
                        <span className="agent-new-badge">新注册</span>
                      ) : null}
                    </div>
                    <div className="agent-list-item-meta">
                      <span>微信：{agent.wechatId}</span>
                      {agent.remarks ? <span>备注：{agent.remarks}</span> : null}
                      <span>注册时间：{new Date(agent.createdAt).toLocaleString("zh-CN")}</span>
                    </div>
                  </div>
                  <button
                    className="button button-secondary agent-edit-button"
                    onClick={() => setEditingAgent(agent)}
                    type="button"
                  >
                    <Edit3 className="icon-xs" />
                    编辑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {editingAgent ? (
        <EditAgentModal
          agent={editingAgent}
          onClose={() => setEditingAgent(null)}
          onSaved={() => {
            setEditingAgent(null);
            void fetchAgents();
          }}
        />
      ) : null}
    </div>,
    document.body
  );
}

function EditAgentModal({
  agent,
  onClose,
  onSaved
}: {
  agent: Agent;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(agent.name);
  const [wechatId, setWechatId] = useState(agent.wechatId);
  const [level, setLevel] = useState<1 | 2>(agent.level);
  const [remarks, setRemarks] = useState(agent.remarks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/agents/${encodeURIComponent(agent.wechatId)}`, {
        body: JSON.stringify({
          name: name.trim(),
          level,
          remarks: remarks.trim(),
          newWechatId: wechatId.trim() !== agent.wechatId ? wechatId.trim() : undefined
        }),
        headers: { "Content-Type": "application/json" },
        method: "PUT"
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        setError(data.message ?? "保存失败");
        return;
      }

      onSaved();
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div
      aria-modal="true"
      className="modal-backdrop"
      role="dialog"
      style={{ zIndex: 50 }}
    >
      <form className="agent-modal login-modal" onSubmit={(e) => void handleSubmit(e)}>
        <div className="agent-modal-header">
          <div>
            <h2>编辑代理</h2>
            <p>{agent.name} ({agent.wechatId})</p>
          </div>
          <button aria-label="关闭" className="modal-close" onClick={onClose} type="button">
            <X className="icon-xs" />
          </button>
        </div>

        <div className="agent-modal-body login-form">
          <label>
            姓名
            <input
              onChange={(e) => setName(e.target.value)}
              value={name}
            />
          </label>
          <label>
            微信号
            <input
              onChange={(e) => setWechatId(e.target.value)}
              value={wechatId}
            />
          </label>
          <label>
            代理等级
            <div className="agent-level-toggle">
              <button
                className={`agent-level-option ${level === 1 ? "is-active" : ""}`}
                onClick={() => setLevel(1)}
                type="button"
              >
                1 级代理
              </button>
              <button
                className={`agent-level-option ${level === 2 ? "is-active" : ""}`}
                onClick={() => setLevel(2)}
                type="button"
              >
                2 级代理
              </button>
            </div>
          </label>
          <label>
            备注
            <textarea
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="可选备注信息..."
              rows={3}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "10px 12px",
                color: "#111827",
                font: "inherit",
                resize: "vertical"
              }}
              value={remarks}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
        </div>

        <div className="agent-modal-actions">
          <button className="button button-secondary" onClick={onClose} type="button">
            取消
          </button>
          <button className="button button-primary" disabled={loading} type="submit">
            {loading ? "保存中..." : "保存"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
