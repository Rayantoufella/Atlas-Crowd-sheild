import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '../lib/icons.jsx';
import API_BASE from '../lib/config.js';

const LABEL_COLORS = {
  BAGARRE: { bg: 'rgba(244,63,94,0.18)', fg: '#fb7185', label: 'Fight' },
  COURSE: { bg: 'rgba(251,146,60,0.18)', fg: '#fdba74', label: 'Running' },
  SOL: { bg: 'rgba(250,204,21,0.18)', fg: '#fde047', label: 'Fallen' },
  ATTROUPEMENT: { bg: 'rgba(59,130,246,0.18)', fg: '#60a5fa', label: 'Crowding' },
};

export default function Forensic() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [liveDetections, setLiveDetections] = useState([]);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [history, setHistory] = useState([]);
  const [lightboxIdx, setLightboxIdx] = useState(null);

  const inputRef = useRef(null);
  const statusRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/forensic/jobs`)
      .then(r => r.json())
      .then(setHistory)
      .catch(() => {});
  }, []);

  const isProcessing = status && (status.status === 'queued' || status.status === 'processing');

  const allDetections = (isProcessing ? liveDetections : (results?.detections || []));

  useEffect(() => {
    if (!jobId) return;
    let stopped = false;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/forensic/status/${jobId}`);
        const data = await res.json();
        if (stopped) return;
        setStatus(data);
        if (data.status === 'done') {
          clearInterval(id);
          const res2 = await fetch(`${API_BASE}/api/forensic/results/${jobId}`);
          const data2 = await res2.json();
          if (!stopped) {
            setResults(data2);
            setUploading(false);
          }
          fetch(`${API_BASE}/api/forensic/jobs`)
            .then(r => r.json())
            .then(setHistory)
            .catch(() => {});
        } else if (data.status === 'error') {
          clearInterval(id);
          if (!stopped) {
            setError(data.error || 'Processing failed');
            setUploading(false);
          }
        }
      } catch {
        clearInterval(id);
        if (!stopped) { setError('Connection lost'); setUploading(false); }
      }
    }, 1500);
    return () => { stopped = true; clearInterval(id); };
  }, [jobId]);

  useEffect(() => {
    if (!isProcessing) { setLiveDetections([]); return; }
    let stopped = false;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/forensic/results/live/${jobId}`);
        const data = await res.json();
        if (!stopped && data.detections) setLiveDetections(data.detections);
      } catch {}
    }, 2000);
    return () => { stopped = true; clearInterval(id); };
  }, [isProcessing, jobId]);

  useEffect(() => {
    if (lightboxIdx === null) return;
    function onKey(e) {
      if (e.key === 'Escape') setLightboxIdx(null);
      if (e.key === 'ArrowLeft') setLightboxIdx(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setLightboxIdx(i => Math.min(allDetections.length - 1, i + 1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIdx, allDetections.length]);

  function handleFile(selected) {
    if (!selected) return;
    if (selected.size > 500 * 1024 * 1024) {
      setError('File too large. Max 500MB.');
      return;
    }
    setFile(selected);
    setError(null);
    setResults(null);
    setStatus(null);
    setLiveDetections([]);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResults(null);
    setStatus(null);
    setLiveDetections([]);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/api/forensic/upload`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setJobId(data.job_id);
    } catch (e) {
      setError(e.message);
      setUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function handleHistoryClick(h) {
    setJobId(h.id);
    setFile(null);
    setError(null);
    if (h.status === 'done') {
      fetch(`${API_BASE}/api/forensic/results/${h.id}`)
        .then(r => r.json())
        .then(data => { setResults(data); setStatus({ status: 'done', ...data }); })
        .catch(() => {});
    } else if (h.status === 'processing' || h.status === 'queued') {
      setStatus({ status: h.status, progress: h.progress, detections_count: h.detections_count });
      setResults(null);
    } else {
      setStatus({ status: h.status });
      setResults(null);
    }
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  const labelMeta = (label) => LABEL_COLORS[label] || { bg: 'rgba(148,163,184,0.18)', fg: '#94a3b8', label };

  function renderSnapshotCard(d, i) {
    const meta = labelMeta(d.label);
    return (
      <div key={d.id || i} className="card" onClick={() => setLightboxIdx(i)}
        style={{
          borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)',
          background: 'var(--bg-2)', cursor: 'pointer',
          transition: 'transform 0.12s', minWidth: 0,
        }}>
        <div style={{
          width: '100%', aspectRatio: '16/9', overflow: 'hidden',
          background: 'var(--bg-3)', position: 'relative',
        }}>
          <img src={`${API_BASE}/api/forensic/snapshot/${d.snapshot}`}
            alt={`Frame ${d.frame}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', top: 6, left: 6, display: 'flex', gap: 4 }}>
            <span style={{
              padding: '2px 7px', borderRadius: 5, fontSize: 10,
              fontWeight: 700, fontFamily: 'var(--font-mono)',
              background: meta.bg, color: meta.fg,
            }}>{meta.label}</span>
          </div>
        </div>
        <div style={{ padding: '8px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 600 }}>#{d.frame}</span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10.5,
              color: d.confidence >= 70 ? 'var(--red-2)' : 'var(--orange-2)',
            }}>{d.confidence}%</span>
          </div>
          <div className="fr" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 2 }}>
            T+{formatTime(d.timestamp)}
          </div>
        </div>
      </div>
    );
  }

  function renderLightbox() {
    if (lightboxIdx === null || allDetections.length === 0) return null;
    const d = allDetections[lightboxIdx];
    const meta = labelMeta(d.label);
    const prev = lightboxIdx > 0;
    const next = lightboxIdx < allDetections.length - 1;

    return (
      <div onClick={() => setLightboxIdx(null)}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        <div onClick={e => e.stopPropagation()} style={{
          position: 'relative', display: 'flex', flexDirection: 'column',
          alignItems: 'center', maxWidth: '90vw', maxHeight: '90vh',
        }}>
          <button onClick={() => setLightboxIdx(null)}
            style={{
              position: 'absolute', top: -40, right: 0,
              background: 'none', border: 'none', color: 'white',
              cursor: 'pointer', fontSize: 22, padding: '4px 8px',
            }}>
            <Icon.X size={22} />
          </button>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {prev && (
              <button onClick={() => setLightboxIdx(lightboxIdx - 1)}
                style={{
                  position: 'absolute', left: -48,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  color: 'white', width: 40, height: 40, borderRadius: '50%',
                  display: 'grid', placeItems: 'center', cursor: 'pointer',
                  fontSize: 18, zIndex: 2,
                }}>
                <Icon.ChevronLeft size={20} />
              </button>
            )}
            <img src={`${API_BASE}/api/forensic/snapshot/${d.snapshot}`}
              alt={`Frame ${d.frame}`}
              style={{
                maxWidth: '85vw', maxHeight: '75vh', borderRadius: 12,
                boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              }} />
            {next && (
              <button onClick={() => setLightboxIdx(lightboxIdx + 1)}
                style={{
                  position: 'absolute', right: -48,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  color: 'white', width: 40, height: 40, borderRadius: '50%',
                  display: 'grid', placeItems: 'center', cursor: 'pointer',
                  fontSize: 18, zIndex: 2,
                }}>
                <Icon.ChevronRight size={20} />
              </button>
            )}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginTop: 14,
            padding: '10px 16px', borderRadius: 10,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          }}>
            <span style={{
              padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
              fontFamily: 'var(--font-mono)', background: meta.bg, color: meta.fg,
            }}>{meta.label}</span>
            <span style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              Frame #{d.frame}
            </span>
            <span style={{ color: d.confidence >= 70 ? '#fb7185' : '#fdba74', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              {d.confidence}%
            </span>
            <span className="fr" style={{ color: '#64748b', fontSize: 11 }}>
              T+{formatTime(d.timestamp)}
            </span>
            <span style={{ color: '#64748b', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              {lightboxIdx + 1} / {allDetections.length}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <div className="eyebrow accent">FORENSIC ANALYSIS</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>Video Intelligence</div>
        <div className="fr" style={{ fontSize: 12.5, color: 'var(--fg-2)', marginTop: 4 }}>
          Upload match footage for automated threat detection
        </div>
      </div>

      {!jobId && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              borderRadius: 16, border: `2px dashed ${dragOver ? 'var(--accent-2)' : 'var(--border-strong)'}`,
              background: dragOver ? 'color-mix(in oklab, var(--accent) 8%, var(--bg-elev))' : 'var(--bg-2)',
              padding: '48px 32px', textAlign: 'center', cursor: 'pointer',
              transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 220,
            }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'color-mix(in oklab, var(--accent-2) 18%, transparent)',
              color: 'var(--accent-2)', display: 'grid', placeItems: 'center',
            }}>
              <Icon.Upload size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Drop video here</div>
              <div className="fr" style={{ fontSize: 11.5, color: 'var(--fg-2)', marginTop: 2 }}>
                or click to browse · MP4, AVI, MOV, MKV up to 500MB
              </div>
            </div>
            <input ref={inputRef} type="file" accept=".mp4,.avi,.mov,.mkv,.webm"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])} />
          </div>

          <div style={{
            borderRadius: 16, border: '1px solid var(--border)',
            background: 'var(--bg-2)', padding: 24,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div>
              <div className="eyebrow">SELECTED FILE</div>
              {file ? (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon.Camera size={20} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{file.name}</div>
                      <div className="fr" style={{ fontSize: 11, color: 'var(--fg-2)' }}>
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="fr" style={{ fontSize: 12.5, color: 'var(--fg-3)', marginTop: 10 }}>
                  No file selected
                </div>
              )}
            </div>
            <button onClick={handleUpload}
              disabled={!file || uploading}
              style={{
                padding: '12px 20px', borderRadius: 10, border: 'none',
                background: !file || uploading ? 'var(--bg-3)' : 'linear-gradient(135deg, var(--accent-2), var(--accent-deep))',
                color: !file || uploading ? 'var(--fg-3)' : 'white',
                fontWeight: 700, fontSize: 13.5, cursor: !file || uploading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s',
                boxShadow: !file || uploading ? 'none' : '0 4px 14px var(--accent-glow)',
              }}>
              {uploading ? 'Uploading...' : 'Analyze Video'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          padding: '14px 18px', borderRadius: 12, marginBottom: 20,
          background: 'color-mix(in oklab, var(--red) 18%, transparent)',
          border: '1px solid color-mix(in oklab, var(--red) 40%, transparent)',
          color: 'var(--red-2)', fontSize: 13, fontWeight: 600,
        }}>
          <span style={{ cursor: 'pointer', float: 'right' }} onClick={() => setError(null)}>
            <Icon.X size={14} />
          </span>
          {error}
        </div>
      )}

      {uploading && !jobId && (
        <div className="card card-pad" style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="spinner" style={{
              width: 14, height: 14, borderRadius: '50%',
              border: '2px solid var(--border)', borderTopColor: 'var(--accent-2)',
              animation: 'spin 0.7s linear infinite',
            }} />
            <span style={{ fontWeight: 600, fontSize: 13 }}>Uploading...</span>
          </div>
        </div>
      )}

      {isProcessing && status && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <div className="card card-pad" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div className="spinner" style={{
                width: 14, height: 14, borderRadius: '50%',
                border: '2px solid var(--border)', borderTopColor: 'var(--accent-2)',
                animation: 'spin 0.7s linear infinite',
              }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Analyzing...</div>
                <div className="fr" style={{ fontSize: 11, color: 'var(--fg-2)' }}>
                  Frame {status.frame}/{status.total_frames} · {status.detections_count} incidents found
                </div>
              </div>
            </div>
            <div style={{
              height: 5, borderRadius: 3, background: 'var(--bg-3)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: 'linear-gradient(90deg, var(--accent-2), var(--accent-deep))',
                width: `${status.progress}%`, transition: 'width 0.3s',
              }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, minHeight: 400 }}>
            <div className="card" style={{
              borderRadius: 14, overflow: 'hidden',
              background: '#000', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              <img src={`${API_BASE}/api/forensic/stream/${jobId}`}
                alt="Live analysis stream"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <div style={{
                position: 'absolute', top: 10, left: 10,
                padding: '4px 10px', borderRadius: 6,
                background: 'rgba(0,0,0,0.6)',
                fontFamily: 'var(--font-mono)', fontSize: 10.5,
                color: 'var(--red-2)', letterSpacing: '0.08em',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--red-2)', animation: 'pulseDot 1.2s ease-in-out infinite',
                }} />
                LIVE STREAM
              </div>
            </div>

            <div className="card" style={{
              borderRadius: 14, border: '1px solid var(--border)',
              background: 'var(--bg-2)', padding: 14,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 10,
              }}>
                <div className="eyebrow" style={{ fontSize: 10.5 }}>LIVE DETECTIONS</div>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  color: status.detections_count > 0 ? 'var(--red-2)' : 'var(--fg-3)',
                }}>
                  {status.detections_count} found
                </span>
              </div>
              {liveDetections.length === 0 ? (
                <div style={{
                  flex: 1, display: 'grid', placeItems: 'center',
                  fontSize: 12, color: 'var(--fg-3)',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 6, opacity: 0.3 }}>⊘</div>
                    <div>No incidents yet</div>
                    <div className="fr" style={{ fontSize: 10.5 }}>Processing video stream...</div>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 8, overflowY: 'auto', flex: 1, alignContent: 'start',
                }}>
                  {liveDetections.map((d, i) => renderSnapshotCard(d, i))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {results && !isProcessing && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
          }}>
            <div>
              <div className="eyebrow accent">RESULTS</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginTop: 2 }}>
                {results.detections_count} incident{results.detections_count !== 1 ? 's' : ''} detected
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className="fr" style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>
                {results.filename}
              </div>
              <button onClick={() => {
                setJobId(null); setResults(null); setStatus(null);
                setFile(null); setLiveDetections([]);
              }} style={{
                padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--bg-2)', color: 'var(--fg-1)', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
              }}>
                New Analysis
              </button>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}>
            {results.detections.map((d, i) => renderSnapshotCard(d, i))}
          </div>
        </div>
      )}

      {history.length > 0 && !isProcessing && !results && (
        <div style={{ marginTop: jobId ? 0 : 40 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>ANALYSIS HISTORY</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {history.slice(0, 10).map((h) => (
              <div key={h.id} onClick={() => handleHistoryClick(h)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', borderRadius: 10,
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  fontSize: 12.5, cursor: 'pointer',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon.Camera size={16} />
                  <span style={{ fontWeight: 600 }}>{h.filename}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    color: h.detections_count > 0 ? 'var(--red-2)' : 'var(--fg-3)',
                  }}>
                    {h.detections_count} incident{h.detections_count !== 1 ? 's' : ''}
                  </span>
                  <span style={{
                    padding: '3px 8px', borderRadius: 5, fontSize: 10.5, fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    background: h.status === 'done' ? 'color-mix(in oklab, var(--green) 18%, transparent)' :
                               h.status === 'error' ? 'color-mix(in oklab, var(--red) 18%, transparent)' :
                               'color-mix(in oklab, var(--accent) 18%, transparent)',
                    color: h.status === 'done' ? 'var(--green-2)' :
                           h.status === 'error' ? 'var(--red-2)' : 'var(--accent-2)',
                  }}>
                    {h.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(results && !isProcessing) && history.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>ANALYSIS HISTORY</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {history.slice(0, 8).map((h) => (
              <div key={h.id} onClick={() => handleHistoryClick(h)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderRadius: 10,
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  fontSize: 12, cursor: 'pointer',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon.Camera size={14} />
                  <span style={{ fontWeight: 600 }}>{h.filename}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5,
                    color: h.detections_count > 0 ? 'var(--red-2)' : 'var(--fg-3)',
                  }}>
                    {h.detections_count} incident{h.detections_count !== 1 ? 's' : ''}
                  </span>
                  <span style={{
                    padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    background: h.status === 'done' ? 'color-mix(in oklab, var(--green) 18%, transparent)' :
                               h.status === 'error' ? 'color-mix(in oklab, var(--red) 18%, transparent)' : '',
                    color: h.status === 'done' ? 'var(--green-2)' :
                           h.status === 'error' ? 'var(--red-2)' : 'var(--accent-2)',
                  }}>
                    {h.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {renderLightbox()}
    </main>
  );
}
