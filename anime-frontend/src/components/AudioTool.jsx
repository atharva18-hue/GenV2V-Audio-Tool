// src/components/AudioTool.jsx
import React, { useState, useRef } from 'react'

/*
AudioTool.jsx
- Drag & drop or choose an audio file.
- Preview using WebAudio API.
- Presets:
  - Kid: Pitch x1.4 + Treble Boost
  - Cat: Pitch x1.8 + Treble Boost
  - Slow: Pitch x0.85
- Export: Renders the effect to a .WAV file using OfflineAudioContext.
*/

// Helper to convert raw audio buffer to WAV format for download
function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  
  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i))
  }

  let offset = 0
  writeString(view, offset, 'RIFF'); offset += 4
  view.setUint32(offset, 36 + samples.length * 2, true); offset += 4
  writeString(view, offset, 'WAVE'); offset += 4
  writeString(view, offset, 'fmt '); offset += 4
  view.setUint32(offset, 16, true); offset += 4
  view.setUint16(offset, 1, true); offset += 2
  view.setUint16(offset, 1, true); offset += 2
  view.setUint32(offset, sampleRate, true); offset += 4
  view.setUint32(offset, sampleRate * 2, true); offset += 4
  view.setUint16(offset, 2, true); offset += 2
  view.setUint16(offset, 16, true); offset += 2
  writeString(view, offset, 'data'); offset += 4
  view.setUint32(offset, samples.length * 2, true); offset += 4

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return new Blob([view], { type: 'audio/wav' })
}

export default function AudioTool() {
  const [fileName, setFileName] = useState(null)
  const [status, setStatus] = useState('idle')
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [downloadName, setDownloadName] = useState('')
  
  // References to Web Audio Objects
  const audioBufferRef = useRef(null)
  const audioCtxRef = useRef(null)
  const sourceRef = useRef(null)

  // Presets configuration
  const presets = {
    normal: { pitch: 1.0, eq: null },
    kid: { pitch: 1.4, eq: { type: 'highshelf', frequency: 3000, gain: 3 } },
    cat: { pitch: 1.8, eq: { type: 'highshelf', frequency: 4000, gain: 6 } },
    slow: { pitch: 0.85, eq: null },
  }

  // Load and Decode Audio
  async function handleFile(file) {
    if (!file) return
    setStatus('loading')
    setDownloadUrl(null)
    setFileName(file.name)
    
    // Create Audio Context if it doesn't exist
    const ac = audioCtxRef.current || (audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)())
    
    try {
      const arr = await file.arrayBuffer()
      const buf = await ac.decodeAudioData(arr)
      audioBufferRef.current = buf
      setStatus('loaded')
    } catch (e) {
      console.error(e)
      setStatus('error')
      alert("Could not decode audio. Try an MP3 or WAV file.")
    }
  }

  function onDrop(e) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  function onChoose(e) {
    const f = e.target.files[0]
    if (f) handleFile(f)
  }

  // Live Preview
  function playPreview(preset) {
    if (!audioBufferRef.current) return
    stopPreview() // Stop previous if playing

    const ac = audioCtxRef.current
    const src = ac.createBufferSource()
    sourceRef.current = src
    src.buffer = audioBufferRef.current
    
    // Apply Pitch/Speed
    src.playbackRate.value = preset.pitch ?? 1.0
    
    let nodeChain = src

    // Apply EQ (if preset has one)
    if (preset.eq) {
      const eq = ac.createBiquadFilter()
      eq.type = preset.eq.type
      eq.frequency.value = preset.eq.frequency
      eq.gain.value = preset.eq.gain
      nodeChain.connect(eq)
      nodeChain = eq
    }

    nodeChain.connect(ac.destination)
    src.start()
    setStatus('playing')
    src.onended = () => setStatus('loaded')
  }

  function stopPreview() {
    try {
      if (sourceRef.current) {
        sourceRef.current.stop(0)
        sourceRef.current.disconnect()
        sourceRef.current = null
      }
    } catch (e) { /* ignore errors if already stopped */ }
    if (audioBufferRef.current) setStatus('loaded')
  }

  // Export to File (The "Magic" Part)
  async function exportProcessed(preset, label) {
    if (!audioBufferRef.current) return
    setStatus('rendering')

    const inputBuf = audioBufferRef.current
    // Calculate new duration based on speed (pitch)
    const duration = inputBuf.duration / (preset.pitch ?? 1.0)
    const sampleRate = 44100
    const channels = 1 // Mixdown to mono for safety/simplicity

    // Offline Context renders faster than real-time
    const offline = new OfflineAudioContext(channels, Math.ceil(duration * sampleRate), sampleRate)
    
    const src = offline.createBufferSource()
    
    // Mix multi-channel input down to mono buffer for export
    const mono = offline.createBuffer(channels, Math.ceil(inputBuf.length / inputBuf.numberOfChannels), inputBuf.sampleRate)
    for (let ch = 0; ch < inputBuf.numberOfChannels; ch++) {
      const data = inputBuf.getChannelData(ch)
      for (let i = 0; i < mono.length; i++) {
        mono.getChannelData(0)[i] = (mono.getChannelData(0)[i] || 0) + (data[i] || 0) / inputBuf.numberOfChannels
      }
    }
    
    src.buffer = mono
    src.playbackRate.value = preset.pitch ?? 1.0
    
    let nodeChain = src
    if (preset.eq) {
      const eq = offline.createBiquadFilter()
      eq.type = preset.eq.type
      eq.frequency.value = preset.eq.frequency
      eq.gain.value = preset.eq.gain
      nodeChain.connect(eq)
      nodeChain = eq
    }
    
    nodeChain.connect(offline.destination)
    src.start(0)

    try {
      // Render
      const rendered = await offline.startRendering()
      const outData = rendered.getChannelData(0)
      
      // Encode to WAV blob
      const wavBlob = encodeWAV(outData, sampleRate)
      const url = URL.createObjectURL(wavBlob)
      
      setDownloadUrl(url)
      setDownloadName(`${fileName?.replace(/\.[^/.]+$/, '') || 'audio'}-${label}.wav`)
      setStatus('done')
    } catch (e) {
      console.error(e)
      setStatus('error')
    }
  }

  return (
    <div className="p-4 bg-indigo-950/50 border border-white/10 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-base font-bold text-white">Audio Tool</div>
          <div className="text-xs text-zinc-400">Make or transform a royalty-free track for your video</div>
        </div>
        <div className="text-xs font-mono text-zinc-300">{status === 'idle' ? 'No audio' : status}</div>
      </div>

      {/* Upload Box */}
      <div 
        onDrop={onDrop} 
        onDragOver={(e)=>e.preventDefault()} 
        className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center transition-colors hover:border-violet-500 hover:bg-white/5 mb-4"
      >
        <div className="text-sm text-zinc-300">
          Drag audio here or 
          <label className="ml-2 px-3 py-1 bg-white text-black font-semibold rounded cursor-pointer hover:bg-gray-200">
            Choose file <input type="file" accept="audio/*" onChange={onChoose} className="hidden" />
          </label>
        </div>
        <div className="text-xs text-zinc-500 mt-2">{fileName || "No file chosen"}</div>
        <div className="text-[10px] text-zinc-600 mt-1">Tip: use YouTube Audio Library / Pixabay / FMA for royalty-free tracks</div>
      </div>

      {/* Playback Controls */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={()=>playPreview(presets.normal)} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition">Play</button>
        <button onClick={()=>playPreview(presets.kid)} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium transition">Kid</button>
        <button onClick={()=>playPreview(presets.cat)} className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-sm font-medium transition">Cat</button>
        <button onClick={()=>playPreview(presets.slow)} className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium transition">Slow</button>
        <button onClick={stopPreview} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition">Stop</button>
      </div>

      {/* Export Controls */}
      <div className="flex gap-2">
        <button onClick={()=>exportProcessed(presets.kid, 'kid')} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold transition shadow-lg shadow-emerald-900/20">Export Kid</button>
        <button onClick={()=>exportProcessed(presets.cat, 'cat')} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold transition shadow-lg shadow-emerald-900/20">Export Cat</button>
        <button onClick={()=>exportProcessed(presets.normal, 'normal')} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold transition shadow-lg shadow-emerald-900/20">Export Normal</button>
      </div>

      {/* Download Link */}
      {downloadUrl && (
        <div className="mt-4 p-3 bg-emerald-900/30 border border-emerald-500/30 rounded-lg flex justify-between items-center animate-pulse">
          <span className="text-xs text-emerald-200">File ready: {downloadName}</span>
          <a download={downloadName} href={downloadUrl} className="px-3 py-1 bg-emerald-500 text-black text-xs font-bold rounded hover:bg-emerald-400">Download</a>
        </div>
      )}
    </div>
  )
}