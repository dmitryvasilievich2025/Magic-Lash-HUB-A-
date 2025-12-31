
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { AuditResult } from '../types';

export const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Функції для роботи з аудіо (Base64 <-> Uint8Array)
export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Аналіз одного або декількох зображень (Gemini 3 Pro) у режимі JSON
 */
export const analyzeLashWork = async (images: string[], prompt: string): Promise<AuditResult> => {
  const ai = getAI();
  const parts = images.map(img => ({
    inlineData: { data: img, mimeType: 'image/jpeg' }
  }));
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [...parts, { text: prompt }]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.NUMBER, description: "Загальний бал від 1 до 10, може бути десятковим." },
          scoreBreakdown: {
            type: Type.OBJECT,
            properties: {
              symmetry: { type: Type.NUMBER, description: "Оцінка симетрії від 1 до 10." },
              direction: { type: Type.NUMBER, description: "Оцінка напрямку від 1 до 10." },
              cleanliness: { type: Type.NUMBER, description: "Оцінка чистоти склейок від 1 до 10." },
            },
            required: ["symmetry", "direction", "cleanliness"]
          },
          strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Масив з 2-3 речень, що описують сильні сторони роботи."
          },
          improvements: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Масив з 2-3 речень, що описують зони для покращення."
          },
          advice: { type: Type.STRING, description: "Детальна порада рівня 'Master-Level' для покращення техніки." }
        },
        required: ["overallScore", "scoreBreakdown", "strengths", "improvements", "advice"]
      },
    }
  });

  if (!response.text) {
    throw new Error("AI response is empty.");
  }
  return JSON.parse(response.text);
};

/**
 * Генерація відео (Veo 3.1)
 */
export const generateEducationalVideo = async (prompt: string, imageBase64?: string) => {
  const ai = getAI();
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    ...(imageBase64 && {
      image: {
        imageBytes: imageBase64,
        mimeType: 'image/png'
      }
    }),
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed: No download link provided");

  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};