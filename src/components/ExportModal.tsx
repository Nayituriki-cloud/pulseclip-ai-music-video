import React, { useState } from 'react';
import {
  Download,
  X,
  CheckCircle2,
  Share2,
  Copy,
  Sparkles,
  Smartphone,
  Tv,
  Square,
  Lock,
} from 'lucide-react';
import { AspectRatio, ExportResolution, VideoFormat } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ar: AspectRatio) => void;
  watermark: boolean;
  setWatermark: (val: boolean) => void;
  onStartExport: (config: {
    resolution: ExportResolution;
    format: VideoFormat;
    aspectRatio: AspectRatio;
    watermark: boolean;
  }) => Promise<void>;
  isExporting: boolean;
  exportProgress: number;
  downloadUrl: string | null;
  trackTitle: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  aspectRatio,
  setAspectRatio,
  watermark,
  setWatermark,
  onStartExport,
  isExporting,
  exportProgress,
  downloadUrl,
  trackTitle,
}) => {
  const [resolution, setResolution] = useState<ExportResolution>('1080p');
  const [format, setFormat] = useState<VideoFormat>('mp4');
  const [planType, setPlanType] = useState<'free' | 'pro'>('pro');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleExportClick = () => {
    onStartExport({
      resolution,
      format,
      aspectRatio,
      watermark: planType === 'free' ? true : watermark,
    });
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#0c0e17] border border-slate-800 rounded-2xl p-6 shadow-2xl relative space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-400 text-slate-950 flex items-center justify-center font-bold">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Export Music Video Clip</h3>
            <p className="text-xs text-slate-400">High-bitrate, audio-synced video ready for social sharing</p>
          </div>
        </div>

        {/* If Download is Ready */}
        {downloadUrl && !isExporting ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="font-bold text-sm text-white">Your Clip Is Rendered & Ready!</div>
              <p className="text-xs text-slate-400">
                Processed in {resolution} · {aspectRatio} · {format.toUpperCase()} · No Watermark
              </p>
            </div>

            <a
              href={downloadUrl}
              download={`${trackTitle.toLowerCase().replace(/\s+/g, '_')}_pulseclip_${resolution}.webm`}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 hover:from-cyan-300 hover:to-teal-200 transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Video Clip (1-Tap)
            </a>

            {/* Direct Share Options */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block">Direct Social Share:</span>
              <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                <button
                  onClick={() => window.open('https://www.tiktok.com/upload', '_blank')}
                  className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-white transition-colors"
                >
                  TikTok
                </button>
                <button
                  onClick={() => window.open('https://www.instagram.com', '_blank')}
                  className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-white transition-colors"
                >
                  IG Reels
                </button>
                <button
                  onClick={() => window.open('https://studio.youtube.com', '_blank')}
                  className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-white transition-colors"
                >
                  YT Shorts
                </button>
                <button
                  onClick={handleCopyShareLink}
                  className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-white transition-colors flex items-center justify-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>
        ) : isExporting ? (
          /* Live Export Progress */
          <div className="space-y-4 py-6 text-center">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-slate-800 border-t-cyan-400 animate-spin" />
              <span className="absolute font-mono text-sm font-bold text-white tabular-nums">
                {exportProgress}%
              </span>
            </div>
            <div>
              <div className="text-sm font-bold text-white">Rendering Beat-Synced Frames...</div>
              <p className="text-xs text-slate-400 mt-1">
                Encoding canvas shaders, camera motions, and master audio stream
              </p>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-teal-300 transition-all duration-150"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        ) : (
          /* Export Configuration Options */
          <div className="space-y-4">
            {/* Resolution Selector */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1.5">Resolution:</span>
              <div className="grid grid-cols-3 gap-2">
                {(['1080p', '2K', '4K'] as ExportResolution[]).map((res) => (
                  <button
                    key={res}
                    onClick={() => setResolution(res)}
                    className={`py-2 text-xs font-mono font-medium rounded-lg border text-center transition-all ${
                      resolution === res
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {res} {res === '4K' && <span className="text-[10px] text-amber-400">Ultra</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1.5">Target Format & Aspect:</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '9:16', label: '9:16 Vertical', desc: 'TikTok, Reels, Shorts', icon: Smartphone },
                  { id: '16:9', label: '16:9 Cinema', desc: 'YouTube, Landscape', icon: Tv },
                  { id: '1:1', label: '1:1 Square', desc: 'Instagram Feed', icon: Square },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = aspectRatio === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setAspectRatio(item.id as AspectRatio)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        <Icon className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{item.id}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plan & Watermark Toggle */}
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Watermark Policy</span>
                  <span className="text-[11px] text-slate-400">Export clean videos without branding</span>
                </div>
                <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
                  <button
                    onClick={() => {
                      setPlanType('pro');
                      setWatermark(false);
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                      planType === 'pro' && !watermark
                        ? 'bg-cyan-500/20 text-cyan-300 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    No Watermark
                  </button>
                  <button
                    onClick={() => {
                      setPlanType('free');
                      setWatermark(true);
                    }}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                      watermark ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    Light Watermark
                  </button>
                </div>
              </div>
            </div>

            {/* Start Export Button */}
            <button
              onClick={handleExportClick}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 transition-all shadow-[0_0_20px_rgba(34,211,238,0.35)] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate & Render Video Clip
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
