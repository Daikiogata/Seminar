"use client"

import React, { useEffect, useRef, useState } from "react"

type Step = { label: string; duration: number }

const SEQUENCE: Step[] = [
  { label: "スクワット", duration: 30 },
  { label: "休憩", duration: 10 },
  { label: "腕立て伏せ", duration: 30 },
  { label: "休憩", duration: 10 },
  { label: "ジャンピングジャック", duration: 30 },
  { label: "休憩", duration: 10 },
]

export default function ServerinTimerPage() {
  const [index, setIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(SEQUENCE[0].duration)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    setTimeLeft(SEQUENCE[index]?.duration ?? 0)
    setFinished(false)
  }, [index])

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
          if (next >= SEQUENCE.length) {
            setRunning(false)
            setFinished(true)
            return 0
          }
          setIndex(next)
          return SEQUENCE[next].duration
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
      setTimeLeft(SEQUENCE[0].duration)
      setRunning(true)
      return
    }
    setRunning((r) => !r)
  }

  function handleNext() {
    const next = Math.min(index + 1, SEQUENCE.length - 1)
    setIndex(next)
    setTimeLeft(SEQUENCE[next].duration)
    setRunning(false)
    setFinished(false)
  }

  function handleReset() {
    setIndex(0)
    setTimeLeft(SEQUENCE[0].duration)
    setRunning(false)
    setFinished(false)
  }

  const current = SEQUENCE[index]
  const percent = current ? ((current.duration - timeLeft) / current.duration) * 100 : 0

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>7分ワークアウト</h1>

      <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{current?.label}</div>
            <div style={{ color: "#666" }}>残り: {timeLeft}s</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 14, color: finished ? "green" : "#333" }}>{finished ? "終了" : `ステップ ${index + 1}/${SEQUENCE.length}`}</div>
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
          {SEQUENCE.slice(index + 1).map((s, i) => (
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