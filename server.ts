import express, { Request, Response } from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

const app = express();
app.use(express.json({ limit: '20mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Analyze song and generate intelligent structure, beats, and emotional tone
app.post('/api/gemini/analyze-track', async (req: Request, res: Response) => {
  try {
    const { title, artist, genre, bpm, mood } = req.body;

    const prompt = `Analyze this music track for generating a high-impact, beat-synced viral music video clip:
Track Title: "${title || 'Untitled Track'}"
Artist: "${artist || 'Unknown Artist'}"
Genre: "${genre || 'Electronic / Hip-Hop'}"
Detected BPM: ${bpm || 128}
User Mood Target: "${mood || 'Energetic'}"

Provide a structured analysis for video editing:
1. Exact song section breakdown for a 30-60s clip (intro, build, drop, chorus, outro) with start/end seconds and energy rating (1-100).
2. Recommended visual style (e.g., Cinematic Anamorphic, Vibrant Neon, Dark & Moody, Luxury Gold, Retro VHS).
3. Dominant color hex codes (3 colors: primary, secondary, accent).
4. Camera motion direction (zooms, whip pans, orbit, slow-mo).
5. Recommended lyric hooks or punchy captions if lyrics are enabled.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            musicalKey: { type: Type.STRING },
            bpm: { type: Type.INTEGER },
            energyScore: { type: Type.INTEGER },
            emotionalTone: { type: Type.STRING },
            recommendedStyle: { type: Type.STRING },
            colorPalette: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            bestHighlightStart: { type: Type.NUMBER },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  startTime: { type: Type.NUMBER },
                  endTime: { type: Type.NUMBER },
                  energy: { type: Type.INTEGER },
                  visualCue: { type: Type.STRING },
                  cameraMove: { type: Type.STRING },
                },
                required: ['name', 'startTime', 'endTime', 'energy', 'visualCue'],
              },
            },
            suggestedLyrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.NUMBER },
                  text: { type: Type.STRING },
                  emphasis: { type: Type.BOOLEAN },
                },
                required: ['time', 'text'],
              },
            },
          },
          required: ['musicalKey', 'bpm', 'energyScore', 'emotionalTone', 'recommendedStyle', 'colorPalette', 'sections'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error analyzing track:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze track',
    });
  }
});

// Generate dynamic scene cuts and beat choreography
app.post('/api/gemini/generate-scenes', async (req: Request, res: Response) => {
  try {
    const { title, style, duration, mood, strongMode, userPrompt } = req.body;

    const prompt = `You are a world-class music video director and VFX editor.
Generate cinematic scene cuts for a ${duration || 30}-second music video clip.
Track: "${title || 'Pulse Track'}"
Style: "${style || 'Cinematic Neon'}"
Mood: "${mood || 'Aggressive Epic'}"
Strong Mode Boost: ${strongMode ? 'YES - MAXIMUM IMPACT, VIOLENT BASS DROPS, ULTRA CONTRAST' : 'NO - BALANCED CINEMATIC'}
User Creative Brief: "${userPrompt || 'High energy beat drops with stunning lighting'}"

Generate 4 to 6 distinct scenes timed tightly across the ${duration || 30}s timeline.
For each scene specify:
- title, startTime, endTime
- visualPrompt (rich cinematic description of visuals)
- cameraEffect (e.g., 'punch_zoom', 'orbit_slow', 'whip_pan_left', 'bass_strobe', 'dramatic_pullback')
- beatHitAction (what happens on the kick/snare: 'screen_flash', 'chromatic_shake', 'particle_burst', 'glitch_warp')
- colorGrade (name of grading preset)
- kineticLyric (short impactful phrase to display on screen)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            conceptSummary: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  startTime: { type: Type.NUMBER },
                  endTime: { type: Type.NUMBER },
                  visualPrompt: { type: Type.STRING },
                  cameraEffect: { type: Type.STRING },
                  beatHitAction: { type: Type.STRING },
                  colorGrade: { type: Type.STRING },
                  kineticLyric: { type: Type.STRING },
                  bassIntensity: { type: Type.NUMBER },
                },
                required: ['id', 'title', 'startTime', 'endTime', 'visualPrompt', 'cameraEffect', 'beatHitAction'],
              },
            },
          },
          required: ['conceptSummary', 'scenes'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error generating scenes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate scenes',
    });
  }
});

// Voice-to-Video / Vibe Prompter
app.post('/api/gemini/vibe-to-video', async (req: Request, res: Response) => {
  try {
    const { vibeDescription } = req.body;

    const prompt = `Convert this creative user description into video production settings for PulseClip:
"${vibeDescription}"

Extract:
1. Recommended visual style (one of: 'Cinematic Anamorphic', 'Dark & Moody', 'Vibrant Neon', 'Luxury Gold', 'Anime Tokyo', 'Abstract Matrix', 'Retro VHS', 'Street Grit')
2. Mood slider rating (Aggressive, Emotional, Energetic, Chill, Epic)
3. Suggested color grades (Primary hex, secondary hex, accent hex)
4. Key visual motifs
5. Suggested lyrics or kinetic caption quotes`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            styleName: { type: Type.STRING },
            mood: { type: Type.STRING },
            palette: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            motifs: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            lyricQuote: { type: Type.STRING },
            cameraAdvice: { type: Type.STRING },
          },
          required: ['styleName', 'mood', 'palette', 'motifs', 'lyricQuote'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error with vibe conversion:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process vibe',
    });
  }
});

async function startServer() {
  const httpServer = http.createServer(app);

  if (!isProduction) {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
        watch: isHmrDisabled ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`PulseClip server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
