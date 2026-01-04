import { GoogleGenAI, Modality, Type } from "@google/genai";
import { AuditResult, Lesson, Course, Section } from '../types';

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
 * Генерація структури курсу з тексту (Gemini 3 Flash)
 */
export const generateCourseStructure = async (rawText: string): Promise<Section[]> => {
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      Analyze the following unstructured text.
      Organize it into a structured array of SECTIONS -> LESSONS -> STEPS for a learning platform.
      
      RULES:
      1. Group content into logical Sections (Modules).
      2. Inside Sections, create Lessons.
      3. Inside Lessons, create Steps.
      4. Steps can be 'lecture' or 'quiz'.
      5. Extract URLs for media if present.
      6. Provide descriptions for everything.
      
      TEXT TO ANALYZE:
      ${rawText}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            lessons: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                   title: { type: Type.STRING },
                   description: { type: Type.STRING },
                   steps: {
                      type: Type.ARRAY,
                      items: {
                         type: Type.OBJECT,
                         properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ["lecture", "quiz", "interaction"] },
                            media: { type: Type.STRING },
                            aiPrompt: { type: Type.STRING },
                            // Legacy quiz fields if single
                            question: { type: Type.STRING },
                            correctAnswer: { type: Type.STRING },
                            // Array for full quiz
                            quizQuestions: {
                               type: Type.ARRAY,
                               items: {
                                  type: Type.OBJECT,
                                  properties: {
                                     question: { type: Type.STRING },
                                     options: { type: Type.ARRAY, items: { type: Type.STRING }},
                                     correctOptionIndex: { type: Type.NUMBER }
                                  }
                               }
                            }
                         },
                         required: ["title", "type"]
                      }
                   }
                },
                required: ["title", "steps"]
              }
            }
          },
          required: ["title", "lessons"]
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate course structure");
  }

  // Parse and normalize IDs
  const data = JSON.parse(response.text);
  return data.map((sec: any, sIdx: number) => ({
    id: `sec-${Date.now()}-${sIdx}`,
    title: sec.title,
    description: sec.description || '',
    lessons: sec.lessons.map((les: any, lIdx: number) => ({
      id: `l-${Date.now()}-${sIdx}-${lIdx}`,
      title: les.title,
      description: les.description || '',
      steps: les.steps.map((step: any, stIdx: number) => ({
        id: (sIdx + 1) * 1000 + (lIdx + 1) * 100 + stIdx,
        ...step,
        quizQuestions: step.quizQuestions?.map((q: any, qIdx: number) => ({
           id: `q-${Date.now()}-${qIdx}`,
           ...q
        }))
      }))
    }))
  }));
};

/**
 * Генерація маркетингового опису курсу на основі програми
 */
export const generateCourseSummary = async (course: Course): Promise<string> => {
  const ai = getAI();
  
  // Flatten structure for prompt
  const structure = course.sections?.map(s => 
    `Section: ${s.title}\n` + s.lessons.map(l => 
       `  Lesson: ${l.title}\n` + l.steps.map(step => `    - ${step.title}`).join('\n')
    ).join('\n')
  ).join('\n\n') || '';

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      Act as a professional educational copywriter for the Beauty Industry (Lash & Brow).
      Write a compelling, structured course description (summary).
      
      Course Title: ${course.title}
      
      Curriculum Structure:
      ${structure}
      
      Generate ONLY the description text.
    `
  });

  return response.text?.trim() || '';
};

/**
 * Генерація розумного контенту для полів курсу (Smart Autofill)
 */
export const generateSmartContent = async (
  context: { 
    courseTitle: string; 
    lessonTitle: string; 
    stepTitle?: string;
    existingContent?: string;
  }, 
  targetField: 'aiPrompt' | 'videoPrompt' | 'interactionPrompt'
): Promise<string> => {
  const ai = getAI();
  
  let systemPrompt = '';
  if (targetField === 'aiPrompt') {
    systemPrompt = "You are an educational content creator. Generate a detailed summary/description for a lesson step. Focus on theory, key concepts, and what the student will learn.";
  } else if (targetField === 'videoPrompt') {
    systemPrompt = "You are a director for educational videos. Create a detailed visual script for a 1-minute video generation (using Veo). Describe the scene, camera angles (macro/close-up), lighting (studio/soft), and action. The subject is Beauty/Lash industry.";
  } else if (targetField === 'interactionPrompt') {
    systemPrompt = "You are configuring an AI Tutor persona (ARI). Write instructions for the AI on how to teach this specific step. Define what questions to ask the student, what to explain, and tone of voice (professional, encouraging).";
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      ${systemPrompt}

      CONTEXT:
      Course: ${context.courseTitle}
      Lesson: ${context.lessonTitle}
      Step: ${context.stepTitle || 'Intro'}
      Additional Info: ${context.existingContent || 'N/A'}

      Generate the content for the '${targetField}' field. Output ONLY the generated text, no markdown or labels.
    `
  });

  return response.text?.trim() || '';
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
      aspectRatio: '16:9'
      // resolution removed as it's not supported in current API version for this model
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
