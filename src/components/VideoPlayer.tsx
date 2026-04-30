import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Loader2,
} from "lucide-react";

export interface PlayerSource {
  url: string;
  title: string;
  isLive?: boolean;
}

interface PlayerProps {
  source: PlayerSource;
  onClose: () => void;
  onPlayingChange?: (playing: boolean) => void;
  onRequestToggle?: (toggle: () => void) => void;
}

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) return "00:00";
  const s = Math.floor(sec % 60);
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function VideoPlayer({ source, onClose, onPlayingChange, onRequestToggle }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load source — start playback as soon as media is ready
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setError(null);
    setBuffering(true);

    const isHls =
      source.url.includes(".m3u8") ||
      source.isLive;

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        startPosition: source.isLive ? -1 : 0,
        // Aggressive buffer settings for fast start
        maxBufferLength: source.isLive ? 5 : 15,
        maxMaxBufferLength: source.isLive ? 10 : 30,
        maxBufferSize: 30 * 1000 * 1000,
        maxBufferHole: 0.3,
        // Fast ABR startup
        abrEwmaDefaultEstimate: 1_000_000,
        abrEwmaDefaultEstimateMax: 5_000_000,
        startFragPrefetch: true,
        // Faster manifest & fragment loading
        manifestLoadingTimeOut: 8000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 8000,
        fragLoadingTimeOut: 15000,
        // Back-buffer cleanup
        backBufferLength: source.isLive ? 5 : 30,
        // Live-specific
        liveSyncDurationCount: source.isLive ? 2 : 3,
        liveMaxLatencyDurationCount: source.isLive ? 4 : Infinity,
        liveDurationInfinity: !!source.isLive,
      });
      hlsRef.current = hls;
      hls.loadSource(source.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            setError("فشل تحميل البث");
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl") && isHls) {
      // Native HLS (Safari)
      video.src = source.url;
      video.addEventListener("loadedmetadata", () => video.play().catch(() => {}), { once: true });
    } else {
      video.src = source.url;
      video.addEventListener("canplay", () => video.play().catch(() => {}), { once: true });
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [source.url, source.isLive]);

  // Events
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setCurrent(v.currentTime);
    const onDur = () => setDuration(v.duration || 0);
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onVol = () => {
      setVolume(v.volume);
      setMuted(v.muted);
    };
    const onErr = () => setError("خطأ في التشغيل");
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onDur);
    v.addEventListener("durationchange", onDur);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("volumechange", onVol);
    v.addEventListener("error", onErr);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onDur);
      v.removeEventListener("durationchange", onDur);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("volumechange", onVol);
      v.removeEventListener("error", onErr);
    };
  }, []);

  // Fullscreen listener
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, 3500);
  }, []);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    showControls();
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [showControls]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
    showControls();
  };

  // Notify parent of playing-state changes
  useEffect(() => {
    onPlayingChange?.(playing);
  }, [playing, onPlayingChange]);

  // Expose togglePlay to parent
  useEffect(() => {
    onRequestToggle?.(togglePlay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRequestToggle]);

  const seek = (delta: number) => {
    const v = videoRef.current;
    if (!v || source.isLive) return;
    v.currentTime = Math.max(0, Math.min((v.duration || 0), v.currentTime + delta));
    showControls();
  };

  const onSeekInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Number(e.target.value);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    showControls();
  };

  const onVolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = Number(e.target.value);
    if (v.volume > 0) v.muted = false;
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen?.();
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[12000] bg-black flex items-center justify-center animate-fade-in"
      onMouseMove={showControls}
      onTouchStart={showControls}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        playsInline
        autoPlay
      />

      {/* Center tap overlay */}
      <button
        type="button"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        className="absolute inset-0 z-10"
        aria-label="play/pause"
      />

      {(buffering || error) && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none z-20">
          {error ? (
            <div className="gold-text font-bold bg-black/80 border border-gold-dark/60 shadow-gold px-5 py-3 rounded-xl">
              {error}
            </div>
          ) : (
            <Loader2 className="w-14 h-14 text-gold animate-spin-gold" />
          )}
        </div>
      )}

      {/* Top bar */}
      <div
        className={`absolute top-0 inset-x-0 p-4 flex items-center justify-between gap-3 bg-gradient-to-b from-black/90 to-transparent z-30 transition-opacity ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-xl glass-dark border border-gold-dark/50 text-gold grid place-items-center hover:bg-gold-dark hover:text-black transition"
          aria-label="close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center text-gold font-bold truncate px-3">
          {source.title}
        </div>
        {source.isLive && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/20 border border-destructive/50 text-destructive text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse-red" />
            LIVE
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div
        className={`absolute bottom-0 inset-x-0 p-3 pt-6 bg-gradient-to-t from-black/95 to-transparent z-30 transition-opacity ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {!source.isLive && (
          <div className="flex items-center gap-3 mb-2" dir="ltr">
            <span className="text-xs font-mono text-gold">{fmt(current)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={current}
              step={0.1}
              onChange={onSeekInput}
              className="flex-1 accent-[hsl(var(--gold))] h-1.5"
            />
            <span className="text-xs font-mono text-gold">{fmt(duration)}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="w-10 h-10 grid place-items-center text-gold hover:text-white"
              aria-label="mute"
            >
              {muted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={onVolChange}
              className="w-20 accent-[hsl(var(--gold))] h-1.5"
              dir="ltr"
            />
          </div>

          <div className="flex items-center gap-3">
            {!source.isLive && (
              <button
                onClick={() => seek(-10)}
                className="w-10 h-10 grid place-items-center text-gold hover:text-white"
                aria-label="rewind"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={togglePlay}
              className="w-12 h-12 grid place-items-center rounded-full gold-bg text-black hover:scale-105 transition"
              aria-label="play/pause"
            >
              {playing ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
            {!source.isLive && (
              <button
                onClick={() => seek(10)}
                className="w-10 h-10 grid place-items-center text-gold hover:text-white"
                aria-label="forward"
              >
                <RotateCw className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 grid place-items-center text-gold hover:text-white"
              aria-label="fullscreen"
            >
              {fullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
            <button
              className="w-10 h-10 grid place-items-center text-gold/70"
              aria-label="settings"
              disabled
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
