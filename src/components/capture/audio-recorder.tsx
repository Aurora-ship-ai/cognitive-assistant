"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, Upload, Loader2, Sparkles } from "lucide-react";

interface AudioRecorderProps {
  onTranscriptReady: (text: string) => void;
}

export function AudioRecorder({ onTranscriptReady }: AudioRecorderProps) {
  const [state, setState] = useState<"idle" | "recording" | "paused" | "done">("idle");
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [manualText, setManualText] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
        clearTimer();
        setState("done");
      };

      mediaRecorder.start(1000);
      startTimeRef.current = Date.now();
      setState("recording");

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (err) {
      alert("无法访问麦克风。请检查浏览器权限设置。");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      clearTimer();
      setState("paused");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now() - duration * 1000;
      setState("recording");
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setState("done");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleUseText = () => {
    if (manualText.trim()) {
      onTranscriptReady(manualText.trim());
    }
  };

  return (
    <div className="space-y-4">
      {/* Recording UI */}
      <div className="card p-6 text-center space-y-4">
        {/* Timer display */}
        {(state === "recording" || state === "paused") && (
          <div className="space-y-2">
            <div className={`text-3xl font-mono font-semibold ${state === "recording" ? "text-red-500 animate-pulse" : "text-[var(--muted)]"}`}>
              {formatTime(duration)}
            </div>
            <div className="flex items-center justify-center gap-1">
              <span className={`w-2 h-2 rounded-full ${state === "recording" ? "bg-red-500" : "bg-yellow-500"}`} />
              <span className="text-xs text-[var(--muted)]">
                {state === "recording" ? "录制中…" : "已暂停"}
              </span>
            </div>
          </div>
        )}

        {/* Audio player */}
        {audioUrl && state === "done" && (
          <div className="space-y-2">
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="hidden"
            />
            <Button variant="secondary" onClick={togglePlayback} size="sm">
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span className="ml-1">{isPlaying ? "暂停" : "播放录音"}</span>
            </Button>
            <p className="text-xs text-[var(--muted)]">录音时长：{formatTime(duration)}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {state === "idle" && (
            <>
              <button
                onClick={startRecording}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg"
                title="开始录音"
              >
                <Mic size={28} />
              </button>
              <label className="p-3 rounded-full bg-[var(--muted-bg)] hover:bg-[var(--border)] text-[var(--muted)] cursor-pointer transition-colors">
                <Upload size={20} />
                <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </>
          )}

          {state === "recording" && (
            <>
              <button
                onClick={pauseRecording}
                className="p-4 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white transition-colors"
                title="暂停"
              >
                <Pause size={24} />
              </button>
              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg"
                title="停止"
              >
                <Square size={28} />
              </button>
            </>
          )}

          {state === "paused" && (
            <>
              <button
                onClick={resumeRecording}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg"
                title="继续"
              >
                <Mic size={28} />
              </button>
              <button
                onClick={stopRecording}
                className="p-4 rounded-full bg-[var(--muted-bg)] hover:bg-[var(--border)] transition-colors"
                title="完成"
              >
                <Square size={24} />
              </button>
            </>
          )}

          {state === "done" && (
            <button
              onClick={() => {
                setState("idle");
                setAudioUrl(null);
                setDuration(0);
                setManualText("");
              }}
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              重新录制
            </button>
          )}
        </div>

        <p className="text-xs text-[var(--muted)]">
          {state === "idle" && "点击麦克风开始录音，或上传音频文件"}
        </p>
      </div>

      {/* Manual transcription */}
      {state === "done" && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            录音完成！请手动输入或粘贴录音的文字内容（后续将支持语音自动转文字）：
          </p>
          <textarea
            placeholder="在此输入录音的文字内容…"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            rows={8}
            className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <Button onClick={handleUseText} disabled={!manualText.trim()} className="w-full">
            <Sparkles size={16} /> 用 AI 整理这段内容
          </Button>
        </div>
      )}
    </div>
  );
}
