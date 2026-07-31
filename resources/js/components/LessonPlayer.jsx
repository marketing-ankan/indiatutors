import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize, Gauge } from 'lucide-react';

// Custom controls for self-hosted (R2) lesson video: 0.25×–2× speed, ±10s skip,
// scrubbing and keyboard shortcuts. Native controls give none of this reliably
// across browsers, so the <video> runs bare and this bar drives it.
//
// Only applies to playback_kind === 'video'. Bunny and YouTube render inside an
// iframe we can't reach into, so those keep their own player chrome.

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SPEED_KEY = 'it_lesson_speed';
const SKIP = 10;

const clock = s => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};

export default function LessonPlayer({ src, title, lessonId }) {
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  // Remembered across lessons — a student who likes 1.5× shouldn't reset it every time.
  const [speed, setSpeed] = useState(() => Number(localStorage.getItem(SPEED_KEY)) || 1);
  const [speedOpen, setSpeedOpen] = useState(false);

  // Re-apply the chosen speed whenever the source changes: a new <video> element
  // starts at 1× regardless of what the previous lesson was playing at.
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.playbackRate = speed;
  }, [speed, src]);

  useEffect(() => { setSpeedOpen(false); setTime(0); setPlaying(false); }, [src]);

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {}); else v.pause();
  }, []);

  const skip = useCallback(delta => {
    const v = videoRef.current;
    if (!v || !isFinite(v.duration)) return;
    v.currentTime = Math.min(Math.max(v.currentTime + delta, 0), v.duration);
  }, []);

  const bumpSpeed = useCallback(dir => {
    setSpeed(s => SPEEDS[Math.min(Math.max(SPEEDS.indexOf(s) + dir, 0), SPEEDS.length - 1)] ?? s);
  }, []);

  const pickSpeed = rate => {
    setSpeed(rate);
    localStorage.setItem(SPEED_KEY, String(rate));
    setSpeedOpen(false);
  };

  // Shortcuts are scoped to the player wrapper (tabIndex=0) so they never
  // hijack typing in the assistant's question box further down the page.
  const onKeyDown = e => {
    const handlers = {
      ' ': () => toggle(),
      k: () => toggle(),
      ArrowLeft: () => skip(-SKIP),
      j: () => skip(-SKIP),
      ArrowRight: () => skip(SKIP),
      l: () => skip(SKIP),
      ArrowUp: () => bumpSpeed(1),
      ArrowDown: () => bumpSpeed(-1),
      m: () => { const v = videoRef.current; if (v) v.muted = !v.muted; },
      f: () => wrapRef.current?.requestFullscreen?.().catch(() => {}),
    };
    const fn = handlers[e.key] ?? handlers[e.key.toLowerCase()];
    if (fn) { e.preventDefault(); fn(); }
  };

  const pct = duration > 0 ? (time / duration) * 100 : 0;

  return (
    <div ref={wrapRef} tabIndex={0} onKeyDown={onKeyDown}
      className="group relative overflow-hidden rounded-2xl bg-black outline-none focus:ring-2 focus:ring-brand-500">
      <div className="aspect-video">
        <video
          key={lessonId}
          ref={videoRef}
          src={src}
          title={title}
          className="h-full w-full"
          playsInline
          preload="metadata"
          controlsList="nodownload"
          onContextMenu={e => e.preventDefault()}
          onClick={toggle}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={e => setTime(e.currentTarget.currentTime)}
          onDurationChange={e => setDuration(e.currentTarget.duration)}
          onVolumeChange={e => setMuted(e.currentTarget.muted)}
          onLoadedMetadata={e => { e.currentTarget.playbackRate = speed; setDuration(e.currentTarget.duration); }}
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2 pt-8">
        <input
          type="range" min="0" max={duration || 0} step="0.1" value={time}
          onChange={e => { const v = videoRef.current; if (v) v.currentTime = Number(e.target.value); }}
          aria-label="Seek"
          className="mb-1 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-brand-500"
          style={{ background: `linear-gradient(to right, #2563eb ${pct}%, rgba(255,255,255,.25) ${pct}%)` }}
        />

        <div className="flex items-center gap-1 text-white">
          <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}
            className="rounded p-1.5 hover:bg-white/15">
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>

          <button type="button" onClick={() => skip(-SKIP)} aria-label="Back 10 seconds"
            className="relative rounded p-1.5 hover:bg-white/15">
            <RotateCcw className="h-5 w-5" />
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">10</span>
          </button>

          <button type="button" onClick={() => skip(SKIP)} aria-label="Forward 10 seconds"
            className="relative rounded p-1.5 hover:bg-white/15">
            <RotateCw className="h-5 w-5" />
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">10</span>
          </button>

          <button type="button" aria-label={muted ? 'Unmute' : 'Mute'}
            onClick={() => { const v = videoRef.current; if (v) v.muted = !v.muted; }}
            className="rounded p-1.5 hover:bg-white/15">
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>

          <span className="ml-1 font-mono text-xs tabular-nums text-white/80">
            {clock(time)} / {clock(duration)}
          </span>

          <div className="relative ml-auto">
            <button type="button" onClick={() => setSpeedOpen(o => !o)}
              aria-label="Playback speed" aria-expanded={speedOpen}
              className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-bold hover:bg-white/15">
              <Gauge className="h-4 w-4" />{speed}×
            </button>
            {speedOpen && (
              <div className="absolute bottom-full right-0 mb-2 overflow-hidden rounded-lg bg-[#0B1220] py-1 shadow-lg ring-1 ring-white/15">
                {SPEEDS.map(r => (
                  <button key={r} type="button" onClick={() => pickSpeed(r)}
                    className={`block w-full px-4 py-1.5 text-left text-xs ${r === speed ? 'bg-brand-600 font-bold' : 'hover:bg-white/10'}`}>
                    {r}×{r === 1 && ' (normal)'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button type="button" aria-label="Fullscreen"
            onClick={() => wrapRef.current?.requestFullscreen?.().catch(() => {})}
            className="rounded p-1.5 hover:bg-white/15">
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
