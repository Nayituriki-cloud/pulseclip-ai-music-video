import React from 'react';
import { Layers, Wand2, Zap } from 'lucide-react';
import { MultiClipVariation } from '../types';

interface MultiVariationBarProps {
  variations: MultiClipVariation[];
  activeVariationId: string;
  onSelectVariation: (variationId: string) => void;
  onGenerateBatchAI: () => void;
  isGeneratingBatch: boolean;
}

export const MultiVariationBar: React.FC<MultiVariationBarProps> = ({
  variations,
  activeVariationId,
  onSelectVariation,
  onGenerateBatchAI,
  isGeneratingBatch,
}) => {
  return (
    <div className="w-full bg-[#0a0d14] border border-slate-800/80 rounded-xl p-3 shadow-md flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 shrink-0">
        <Layers className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-bold text-white tracking-wide">Multi-Clip Cuts:</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto py-0.5">
        {variations.map((v) => {
          const isSelected = v.id === activeVariationId;
          return (
            <button
              key={v.id}
              onClick={() => onSelectVariation(v.id)}
              className={`px-3 py-1.5 rounded-lg border text-left transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm ring-1 ring-cyan-500/30'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {v.strongMode && <Zap className="w-3 h-3 text-rose-400" />}
                <span className="text-xs font-semibold">{v.title}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">[{v.mood}]</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onGenerateBatchAI}
        disabled={isGeneratingBatch}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-300 bg-purple-500/20 border border-purple-500/40 rounded-lg hover:bg-purple-500/30 transition-all shrink-0 disabled:opacity-50"
      >
        <Wand2 className={`w-3.5 h-3.5 ${isGeneratingBatch ? 'animate-spin' : ''}`} />
        <span>{isGeneratingBatch ? 'Generating Batch...' : 'AI Batch Variations'}</span>
      </button>
    </div>
  );
};
