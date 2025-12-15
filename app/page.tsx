"use client"

import React, { useEffect, useRef, useState } from "react"

type Step = { label: string; duration: number }

const DEFAULT_SEQUENCE: Step[] = [
  { label: "スクワット", duration: 30 },
  { label: "休憩", duration: 10 },
  { label: "腕立て伏せ", duration: 30 },
  { label: "休憩", duration: 10 },
  { label: "ジャンピングジャック", duration: 30 },
  { label: "休憩", duration: 10 },
]

export default function ServerinTimerPage() {
  const [sequence, setSequence] = useState<Step[]>(() => {
    try {
      const raw = localStorage.getItem("workout_sequence")
      if (!raw) return DEFAULT_SEQUENCE
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_SEQUENCE
      return parsed.map((p: any) => ({ label: String(p.label ?? ""), duration: Number(p.duration ?? 0) }))
    } catch (e) {
      return DEFAULT_SEQUENCE
    }
  })

  const [index, setIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(sequence[0]?.duration ?? 0)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    setTimeLeft(sequence[index]?.duration ?? 0)
    setFinished(false)
  }, [index, sequence])

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          const next = index + 1
          if (next >= sequence.length) {
            setRunning(false)
            setFinished(true)
            return 0
          }
          setIndex(next)
          return sequence[next].duration
        }
        return t - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [running, index])

  function handleStartPause() {
    if (finished) {
      setIndex(0)
      setFinished(false)
      setTimeLeft(sequence[0]?.duration ?? 0)
      setRunning(true)
      return
    }
    setRunning((r) => !r)
  }

  function handleNext() {
    const next = Math.min(index + 1, sequence.length - 1)
    setIndex(next)
    setTimeLeft(sequence[next].duration)
    setRunning(false)
    setFinished(false)
  }

  function handleReset() {
    setIndex(0)
    setTimeLeft(sequence[0]?.duration ?? 0)
    setRunning(false)
    setFinished(false)
  }

  const current = sequence[index]
  const percent = current && current.duration > 0 ? ((current.duration - timeLeft) / current.duration) * 100 : 0

  // Persist sequence when it changes
  useEffect(() => {
    try {
      localStorage.setItem("workout_sequence", JSON.stringify(sequence))
    } catch (e) {
      // ignore
    }
    if (index >= sequence.length) {
      setIndex(0)
    }
  }, [sequence])

  // Editing helpers
  function updateStepLabel(i: number, label: string) {
    setSequence((s) => s.map((st, idx) => (idx === i ? { ...st, label } : st)))
  }
  function updateStepDuration(i: number, durationRaw: string) {
    const duration = Math.max(0, Number(durationRaw) || 0)
    setSequence((s) => s.map((st, idx) => (idx === i ? { ...st, duration } : st)))
  }
  function addStep() {
    setSequence((s) => [...s, { label: "新しいメニュー", duration: 30 }])
  }
  function removeStep(i: number) {
    setSequence((s) => s.filter((_, idx) => idx !== i))
  }
  function resetToDefaults() {
    setSequence(DEFAULT_SEQUENCE)
    setIndex(0)
    setTimeLeft(DEFAULT_SEQUENCE[0].duration)
    setRunning(false)
    setFinished(false)
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>7分ワークアウト</h1>

      <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>メニュー設定</h3>
        {sequence.map((s: Step, i: number) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <input value={s.label} onChange={(e) => updateStepLabel(i, e.target.value)} style={{ flex: 1, padding: 6 }} />
            <input value={String(s.duration)} onChange={(e) => updateStepDuration(i, e.target.value)} type="number" min={0} style={{ width: 80, padding: 6 }} />
            <button onClick={() => removeStep(i)} style={{ padding: "6px 8px" }}>削除</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={addStep} style={{ padding: "8px 12px" }}>ステップを追加</button>
          <button onClick={resetToDefaults} style={{ padding: "8px 12px" }}>デフォルトに戻す</button>
        </div>
      </div>

      <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{current?.label}</div>
            <div style={{ color: "#666" }}>残り: {timeLeft}s</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 14, color: finished ? "green" : "#333" }}>{finished ? "終了" : `ステップ ${index + 1}/${sequence.length}`}</div>
          </div>
        </div>

        <div style={{ height: 12, background: "#f0f0f0", borderRadius: 6, overflow: "hidden", marginTop: 12 }}>
          <div style={{ width: `${percent}%`, height: "100%", background: "#4caf50", transition: "width 200ms linear" }} />
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
          <button onClick={handleStartPause} style={{ padding: "8px 12px" }}>
            {running ? "一時停止" : finished ? "再実行" : "開始"}
          </button>
          <button onClick={handleNext} style={{ padding: "8px 12px" }}>次へ</button>
          <button onClick={handleReset} style={{ padding: "8px 12px" }}>リセット</button>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <h3 style={{ marginBottom: 8 }}>これからの流れ</h3>
        <ol>
          {sequence.slice(index + 1).map((s: Step, i: number) => (
            <li key={i} style={{ marginBottom: 6 }}>
              {s.label} — {s.duration}s
            </li>
          ))}
        </ol>
      </div>

      <div style={{ marginTop: 12, color: "#666" }}>
        <strong>備考:</strong> 読み上げ（TTS）は無効です。
      </div>
    </div>
  )
}