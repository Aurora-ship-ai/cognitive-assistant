"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useUIStore } from "@/lib/store/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Key, Zap, User, LogIn, LogOut, Eye, EyeOff } from "lucide-react";

export function SettingsPage() {
  const { userName, userId, isAuthenticated, authMode, signOut } = useAuthStore();

  // API Key settings (stored in localStorage for now)
  const [deepseekKey, setDeepseekKey] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("ai_key_deepseek") ?? "";
    return "";
  });
  const [qwenKey, setQwenKey] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("ai_key_qwen") ?? "";
    return "";
  });
  const [zhipuKey, setZhipuKey] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("ai_key_zhipu") ?? "";
    return "";
  });
  const [iflytekAppId, setIflytekAppId] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("ai_key_iflytek_appid") ?? "";
    return "";
  });
  const [iflytekKey, setIflytekKey] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("ai_key_iflytek") ?? "";
    return "";
  });

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const saveKeys = () => {
    localStorage.setItem("ai_key_deepseek", deepseekKey);
    localStorage.setItem("ai_key_qwen", qwenKey);
    localStorage.setItem("ai_key_zhipu", zhipuKey);
    localStorage.setItem("ai_key_iflytek_appid", iflytekAppId);
    localStorage.setItem("ai_key_iflytek", iflytekKey);
  };

  const toggleShowKey = (name: string) => {
    setShowKeys((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">设置</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          配置 AI 密钥和账号信息
        </p>
      </div>

      {/* Account section */}
      <section className="card p-4 space-y-3">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <User size={16} /> 账号
        </h2>
        {isAuthenticated && userName ? (
          <div className="space-y-2">
            <p className="text-sm flex items-center gap-2">
              <User size={14} /> {userName}
              {authMode === "local" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-light)] text-[var(--accent)]">
                  本地模式
                </span>
              )}
            </p>
            <p className="text-xs text-[var(--muted)]">
              ID: {userId}
            </p>
            <p className="text-xs text-[var(--muted)]">
              数据保存在本地浏览器中，配置 Supabase 后可云端同步。
            </p>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut size={14} /> 退出
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-[var(--muted)] mb-2">未创建知识空间</p>
            <p className="text-xs text-[var(--muted)] mb-3">
              返回首页创建你的知识空间。
            </p>
            <Button size="sm" onClick={() => useUIStore.getState().setActiveTab("home")}>
              <LogIn size={14} /> 去创建
            </Button>
          </div>
        )}
      </section>

      {/* AI Keys section */}
      <section className="card p-4 space-y-4">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <Key size={16} /> AI 模型密钥
        </h2>
        <p className="text-xs text-[var(--muted)]">
          配置至少一个 AI 提供商即可使用。密钥保存在本地浏览器中，不会上传到服务器。
        </p>

        {/* DeepSeek */}
        <div>
          <label className="text-xs font-medium mb-1 block">
            <Zap size={12} className="inline mr-1" />
            DeepSeek API Key（推荐）
          </label>
          <div className="flex gap-1">
            <Input
              type={showKeys["deepseek"] ? "text" : "password"}
              placeholder="sk-..."
              value={deepseekKey}
              onChange={(e) => setDeepseekKey(e.target.value)}
              className="flex-1 text-xs h-8"
            />
            <button
              onClick={() => toggleShowKey("deepseek")}
              className="px-2 text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              {showKeys["deepseek"] ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p className="text-[10px] text-[var(--muted)] mt-0.5">
            获取地址: platform.deepseek.com → API Keys
          </p>
        </div>

        {/* Qwen */}
        <div>
          <label className="text-xs font-medium mb-1 block">
            <Zap size={12} className="inline mr-1" />
            通义千问 API Key（备用）
          </label>
          <div className="flex gap-1">
            <Input
              type={showKeys["qwen"] ? "text" : "password"}
              placeholder="sk-..."
              value={qwenKey}
              onChange={(e) => setQwenKey(e.target.value)}
              className="flex-1 text-xs h-8"
            />
            <button
              onClick={() => toggleShowKey("qwen")}
              className="px-2 text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              {showKeys["qwen"] ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p className="text-[10px] text-[var(--muted)] mt-0.5">
            获取地址: dashscope.aliyun.com → API-KEY管理
          </p>
        </div>

        {/* Zhipu */}
        <div>
          <label className="text-xs font-medium mb-1 block">
            <Zap size={12} className="inline mr-1" />
            智谱GLM API Key（备用）
          </label>
          <div className="flex gap-1">
            <Input
              type={showKeys["zhipu"] ? "text" : "password"}
              placeholder="..."
              value={zhipuKey}
              onChange={(e) => setZhipuKey(e.target.value)}
              className="flex-1 text-xs h-8"
            />
            <button
              onClick={() => toggleShowKey("zhipu")}
              className="px-2 text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              {showKeys["zhipu"] ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p className="text-[10px] text-[var(--muted)] mt-0.5">
            获取地址: open.bigmodel.cn → API Keys
          </p>
        </div>

        {/* iFlytek */}
        <div>
          <label className="text-xs font-medium mb-1 block">
            <Zap size={12} className="inline mr-1" />
            讯飞语音（语音转文字用）
          </label>
          <Input
            placeholder="App ID"
            value={iflytekAppId}
            onChange={(e) => setIflytekAppId(e.target.value)}
            className="text-xs h-8 mb-1"
          />
          <div className="flex gap-1">
            <Input
              type={showKeys["iflytek"] ? "text" : "password"}
              placeholder="API Secret"
              value={iflytekKey}
              onChange={(e) => setIflytekKey(e.target.value)}
              className="flex-1 text-xs h-8"
            />
            <button
              onClick={() => toggleShowKey("iflytek")}
              className="px-2 text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              {showKeys["iflytek"] ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p className="text-[10px] text-[var(--muted)] mt-0.5">
            获取地址: console.xfyun.cn → 语音转写
          </p>
        </div>

        <Button onClick={saveKeys} className="w-full">
          保存密钥
        </Button>
      </section>

      {/* About */}
      <section className="card p-4">
        <h2 className="text-sm font-medium flex items-center gap-2 mb-2">
          <Settings size={16} /> 关于
        </h2>
        <p className="text-xs text-[var(--muted)]">
          认知助手 · 辅助输入 v0.1.0
          <br />
          个人知识获取与深度理解工具
          <br />
          学习工具三部曲之一：辅助输入 → 辅助记忆（未来）→ 辅助输出（未来）
        </p>
      </section>
    </div>
  );
}
