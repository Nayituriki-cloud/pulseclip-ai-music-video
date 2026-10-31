import React, { useState } from 'react';
import { Sparkles, X, Mic, Send, Lightbulb } from 'lucide-react';

interface VoiceToVibeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitVibe: (vibeText: string) => void;
  isLoading: boolean;
}

export const VoiceToVibeModal: React.FC<VoiceToVibeModalProps> = ({
  isOpen,
  onClose,
  onSubmitVibe,
  isLoading,
}) => {
  const [promptText, setPromptText] = useState('');

  if (!isOpen) return null;

  const quickPrompts = [
    'Aggressive drift phonk with rain on asphalt, purple lightning, and heavy bass strobe drops',
    'Cinematic dark concert stage with intense overhead beams and slow-motion artist silhouette',
    'Luxury high-fashion aesthetic with sleek liquid gold reflections and elegant titanium angles',
    'Futuristic Tokyo cyberpunk skyline with rapid light streaks and hyper vibrant anime colors',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() || isLoading) return;
    onSubmitVibe(promptText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
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
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/40">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Voice & Vibe Prompter</h3>
            <p className="text-xs text-slate-400">Describe your dream video clip vibe in plain English</p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              rows={4}
              placeholder="e.g. Ultra high-energy festival drop with neon laser beams, crowd shockwaves, and violent camera whip pans timed to the beat..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 resize-none"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                // Speech recognition simulation or fallback
                if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                  const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                  const recognition = new SpeechRec();
                  recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setPromptText(transcript);
                  };
                  recognition.start();
                } else {
                  setPromptText('Fast night drive in Tokyo with neon light trails and bass drop shake');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Mic className="w-3.5 h-3.5 text-purple-400" />
              <span>Voice Dictate</span>
            </button>

            <button
              type="submit"
              disabled={isLoading || !promptText.trim()}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-500 hover:to-indigo-500 transition-all shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Video...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Generate Vibe</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Inspiration Prompts */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Try an aesthetic prompt:</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {quickPrompts.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPromptText(q)}
                className="text-left text-[11px] text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 p-2 rounded-lg border border-slate-800 transition-colors truncate"
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
