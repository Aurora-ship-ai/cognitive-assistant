"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, User, Mail, ArrowRight } from "lucide-react";

export function LoginForm() {
  const { loginLocal } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"welcome" | "form">("welcome");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      loginLocal(name.trim(), email.trim() || undefined);
    }
  };

  if (step === "welcome") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="text-center max-w-md space-y-8">
          {/* Logo */}
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center mx-auto">
              <Sparkles size={28} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">认知助手</h1>
            <p className="text-[var(--muted)] leading-relaxed">
              你的个人知识获取与深度理解工具
              <br />
              捕获、构建、理解——让每个知识点都有归处
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 text-left">
            <div className="card p-3">
              <p className="text-xs font-medium mb-1">📥 多元捕获</p>
              <p className="text-[10px] text-[var(--muted)]">录音·视频·截取·手动</p>
            </div>
            <div className="card p-3">
              <p className="text-xs font-medium mb-1">🌳 知识树</p>
              <p className="text-[10px] text-[var(--muted)]">游戏化点亮图谱</p>
            </div>
            <div className="card p-3">
              <p className="text-xs font-medium mb-1">🔬 深加工</p>
              <p className="text-[10px] text-[var(--muted)]">形象解释·审视真伪</p>
            </div>
          </div>

          <Button onClick={() => setStep("form")} size="lg" className="w-full">
            开始使用 <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="text-center max-w-sm w-full space-y-6">
        <div>
          <h2 className="text-xl font-semibold">创建你的知识空间</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            数据保存在本地浏览器中
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
              <User size={12} /> 你的名字
            </label>
            <Input
              placeholder="怎么称呼你？"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
              <Mail size={12} /> 邮箱（可选）
            </label>
            <Input
              type="email"
              placeholder="用于未来数据同步"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={!name.trim()}>
            进入认知助手 <ArrowRight size={16} />
          </Button>
        </form>

        <button
          onClick={() => setStep("welcome")}
          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← 返回
        </button>
      </div>
    </div>
  );
}
