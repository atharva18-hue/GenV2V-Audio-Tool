import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, FileVideo, Sparkles, Download, 
  Zap, Activity, CheckCircle, AlertCircle, RefreshCw 
} from 'lucide-react'
import AudioTool from './components/AudioTool'

// --- Animated Background Component ---
const Background = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0a0a0a]">
    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px] animate-pulse" />
    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] animate-pulse delay-1000" />
    <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-pink-900/10 blur-[100px] animate-bounce duration-[10s]" />
  </div>
)

export default function App() {
  const [file, setFile] = useState(null)
  const [style, setStyle] = useState('face_paint_512_v2')
  const [resolution, setResolution] = useState('720')
  const [jobId, setJobId] = useState(null)
  const [status, setStatus] = useState(null)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef(null)

  // --- Logic (Same as before) ---
  useEffect(() => {
    let timer
    if (jobId && status !== 'done' && status !== 'error') {
      timer = setInterval(async () => {
        try {
          const res = await fetch(`/api/status/${jobId}`)
          if (!res.ok) throw new Error('Status fetch failed')
          const j = await res.json()
          setStatus(j.status)
          setProgress(j.progress ?? 0)
          setMessage(j.message ?? '')
          if (j.status === 'done') {
            clearInterval(timer)
            const r = await fetch(`/api/result/${jobId}`)
            if (r.ok) {
              const rr = await r.json()
              setDownloadUrl(rr.downloadUrl)
            }
          }
        } catch (e) {
          setMessage('Could not fetch status')
        }
      }, 1500)
    }
    return () => clearInterval(timer)
  }, [jobId, status])

  function humanSize(bytes) {
    if (!bytes) return ''
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes / Math.pow(1024, i)).toFixed(1) * 1 + ' ' + ['B','KB','MB','GB'][i]
  }

  function onDrop(e) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  async function submit() {
    if (!file) return
    setIsSubmitting(true)
    setStatus('pending')
    setProgress(0)
    setMessage('Uploading video...')

    const fd = new FormData()
    fd.append('file', file)
    fd.append('style', style)
    fd.append('resolution', resolution)

    try {
      const r = await fetch('/api/convert', { method: 'POST', body: fd })
      if (!r.ok) throw new Error('Upload failed')
      const j = await r.json()
      setJobId(j.jobId)
      setMessage('Queued for processing...')
    } catch (e) {
      setStatus('error')
      setMessage(e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetAll() {
    setFile(null)
    setJobId(null)
    setStatus(null)
    setProgress(0)
    setMessage('')
    setDownloadUrl(null)
  }

  // --- Animations ---
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  }

  return (
    <div className="min-h-screen text-slate-100 font-sans selection:bg-purple-500/30 flex items-center justify-center p-4 lg:p-8">
      <Background />
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        
        {/* LEFT COLUMN: Controls & Upload */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Header Card */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-purple-900/20">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent">
                V2V 
              </h1>
              <p className="text-zinc-400 mt-2 text-sm">
                Transform your videos into high-quality anime scenes using AI.
              </p>
            </motion.div>
          </div>

          {/* Upload Area */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="group relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-1 overflow-hidden"
          >
            <div 
              onDrop={onDrop}
              onDragOver={(e)=>e.preventDefault()}
              onClick={()=>inputRef.current?.click()}
              className={`relative z-10 h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300
                ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-purple-500/50 hover:bg-white/5'}
              `}
            >
              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div 
                    key="file"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-4"
                  >
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileVideo className="text-emerald-400" size={32} />
                    </div>
                    <div className="font-medium text-lg text-white truncate max-w-[250px]">{file.name}</div>
                    <div className="text-sm text-emerald-400/80 mt-1">{humanSize(file.size)}</div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-500/20 transition-colors">
                      <Upload className="text-zinc-400 group-hover:text-purple-300 transition-colors" size={32} />
                    </div>
                    <div className="text-lg font-medium text-white">Drop video here</div>
                    <div className="text-sm text-zinc-500 mt-1">or click to browse</div>
                  </motion.div>
                )}
              </AnimatePresence>
              <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} />
            </div>
          </motion.div>

          {/* Settings */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col gap-4">
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={12} /> Anime Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'face_paint_512_v2', name: 'Face Model (Clean)' },
                  { id: 'hayao', name: 'Ghibli (Scenery)' },
                  { id: 'paprika', name: 'Paprika (Artistic)' },
                  { id: 'shinkai', name: 'Shinkai (Vibrant)' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left border ${
                      style === s.id 
                      ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/50' 
                      : 'bg-white/5 border-transparent text-zinc-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-white/5">
              <button 
                onClick={submit}
                disabled={!file || isSubmitting}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 flex items-center justify-center gap-2
                  ${!file || isSubmitting 
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white hover:scale-[1.02] shadow-purple-900/30'
                  }
                `}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Zap className="fill-white" /> Convert Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Status & Preview */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Status Monitor */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 min-h-[300px] flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 z-10">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${status === 'done' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-zinc-400'}`}>
                  <Activity size={20} />
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-300">System Status</div>
                  <div className="text-xs text-zinc-500 font-mono mt-0.5 uppercase">{status || 'IDLE'}</div>
                </div>
              </div>
              {downloadUrl && (
                <motion.a 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  href={downloadUrl}
                  download
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full text-sm flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-colors"
                >
                  <Download size={16} /> Download Result
                </motion.a>
              )}
            </div>

            {/* Progress Visualization */}
            <div className="flex-1 flex flex-col justify-center items-center relative z-10">
              {downloadUrl ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="w-full h-full rounded-2xl overflow-hidden bg-black/50 border border-white/5 shadow-2xl relative group"
                >
                  <video src={downloadUrl} controls className="w-full h-full object-contain" />
                </motion.div>
              ) : (
                <div className="w-full max-w-md mx-auto text-center">
                  {status === 'running' || status === 'pending' ? (
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs text-purple-300 font-medium px-1">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ type: "spring", stiffness: 50 }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_ease-in-out_infinite]" />
                        </motion.div>
                      </div>
                      <p className="text-zinc-400 text-sm animate-pulse">{message}</p>
                    </div>
                  ) : (
                    <div className="text-zinc-600 flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/5 flex items-center justify-center mb-4">
                        <Sparkles size={24} className="opacity-20" />
                      </div>
                      <p className="text-sm">Preview will appear here</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Audio Tool Integration */}
          <motion.div 
            variants={itemVariants} 
            initial="hidden" 
            animate="visible" 
            transition={{ delay: 0.3 }}
          >
            <AudioTool />
          </motion.div>

        </div>
      </motion.div>
    </div>
  )
}