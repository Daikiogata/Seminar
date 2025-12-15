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
  const [sequence, setSequence] = useState<Step[]>(DEFAULT_SEQUENCE)

  const [index, setIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(sequence[0]?.duration ?? 0)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [presets, setPresets] = useState<{ name: string; seq: Step[] }[]>([])

  // Load stored sequence and presets on mount to avoid SSR/CSR hydration mismatch
  useEffect(() => {
    try {
      const raw = localStorage.getItem("workout_sequence")
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSequence(parsed.map((p: any) => ({ label: String(p.label ?? ""), duration: Number(p.duration ?? 0) })))
        }
      }
    } catch (e) {
      // ignore
    }
    try {
      const rawP = localStorage.getItem("workout_presets")
      if (rawP) {
        const parsedP = JSON.parse(rawP)
        if (Array.isArray(parsedP)) setPresets(parsedP)
      }
    } catch (e) {
      // ignore
    }
  }, [])

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
  function moveUp(i: number) {
    if (i <= 0) return
    setSequence((s) => {
      const arr = [...s]
      ;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
      return arr
    })
  }
  function moveDown(i: number) {
    setSequence((s) => {
      if (i >= s.length - 1) return s
      const arr = [...s]
      ;[arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]
      return arr
    })
  }
  function confirmRemove(i: number) {
    setDeleteIndex(i)
  }
  function doRemove() {
    if (deleteIndex == null) return
    removeStep(deleteIndex)
    setDeleteIndex(null)
  }
  function cancelRemove() {
    setDeleteIndex(null)
  }
  function savePreset() {
    const name = prompt("プリセット名を入力してください")
    if (!name) return
    const p = { name, seq: sequence }
    const next = [...presets.filter((pr) => pr.name !== name), p]
    setPresets(next)
    localStorage.setItem("workout_presets", JSON.stringify(next))
    alert("プリセットを保存しました")
  }
  function loadPreset(i: number) {
    const p = presets[i]
    if (!p) return
    setSequence(p.seq)
  }
  function exportJSON() {
    const data = JSON.stringify(sequence, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "workout_sequence.json"
    a.click()
    URL.revokeObjectURL(url)
  }
  function importJSON(file: File | null) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (!Array.isArray(parsed)) throw new Error("invalid")
        setSequence(parsed.map((p: any) => ({ label: String(p.label ?? ""), duration: Number(p.duration ?? 0) })))
      } catch (e) {
        alert("インポートに失敗しました: JSON形式を確認してください。")
      }
    }
    reader.readAsText(file)
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

  const isStepValid = (s: Step) => s.label.trim().length > 0 && s.duration >= 1 && s.duration <= 600
  const allValid = sequence.length > 0 && sequence.every(isStepValid)

  return (
    <div>
      <header className="topbar">
        <div className="topbar-inner">
          <h1 className="app-title">7-Min Workout</h1>
          <div style={{ marginLeft: 8, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Workout Timer</div>
        </div>
      </header>
      <div className="workout-root">
      <div className="panels">
        <aside className="menu-panel" aria-labelledby="menu-title">
          <h3 id="menu-title">Menu Settings</h3>
          {sequence.map((s: Step, i: number) => (
            <div key={i} className="menu-row">
              <div className="step-index">{i + 1}</div>
              <input aria-label={`Step ${i + 1} name`} value={s.label} onChange={(e) => updateStepLabel(i, e.target.value)} className="menu-input label" placeholder="Exercise name" />
              <input aria-label={`Step ${i + 1} seconds`} value={String(s.duration)} onChange={(e) => updateStepDuration(i, e.target.value)} type="number" min={0} className="menu-input duration" />
              <div className="menu-actions">
                <button aria-label="上へ" onClick={() => moveUp(i)} className="icon">▲</button>
                <button aria-label="下へ" onClick={() => moveDown(i)} className="icon">▼</button>
                <button aria-label="削除" onClick={() => confirmRemove(i)} className="danger">削除</button>
              </div>
              {!isStepValid(s) && (
                <div style={{ color: "#ff6b6b", fontSize: 12, marginTop: 4, marginLeft: 48 }}>
                  {s.label.trim().length === 0 ? "Please enter a name." : s.duration < 1 || s.duration > 600 ? "Duration must be between 1 and 600 seconds." : null}
                </div>
              )}
            </div>
          ))}
          <div className="menu-controls">
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addStep} className="btn">ステップを追加</button>
              <button onClick={resetToDefaults} className="btn">デフォルトに戻す</button>
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={savePreset} className="btn">Save Preset</button>
              <button onClick={exportJSON} className="btn">Export</button>
              <label className="btn file">
                Import
                <input aria-label="Import JSON" type="file" accept="application/json" onChange={(e) => importJSON(e.target.files?.[0] ?? null)} hidden />
              </label>
            </div>
          </div>
        </aside>

        <main className="timer-panel">
          <div className="timer-card">
            <div className="hero">
              <div>
                <div className="time-big" aria-live="polite">{timeLeft}s</div>
                <div className="current-label">{current?.label}</div>
              </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, color: finished ? 'var(--success)' : 'var(--muted)' }}>{finished ? 'Done' : `Step ${index + 1}/${sequence.length}`}</div>
                </div>
            </div>

            <div className="progress-wrap" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}>
              <div className="progress" style={{ width: `${percent}%` }} />
            </div>

            <div style={{ marginTop: 18 }} className="control-row">
              <button onClick={handleStartPause} disabled={!allValid} className="primary" aria-pressed={running}>{running ? 'Pause' : finished ? 'Restart' : 'Start'}</button>
              <button onClick={handleNext} className="btn">Next</button>
              <button onClick={handleReset} className="btn">Reset</button>
            </div>
          </div>
        </main>
      </div>
        {deleteIndex != null && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal">
              <div style={{ marginBottom: 12 }}>Delete this step?</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={cancelRemove} className="btn">Cancel</button>
                <button onClick={doRemove} className="danger">Delete</button>
              </div>
            </div>
          </div>
        )}

      <div style={{ marginTop: 18 }}>
        <h3 style={{ marginBottom: 8 }}>Upcoming</h3>
        <ol>
          {sequence.slice(index + 1).map((s: Step, i: number) => (
            <li key={i} style={{ marginBottom: 6 }}>
              {s.label} — {s.duration}s
            </li>
          ))}
        </ol>
      </div>
    
    </div>
  </div>
  )
}