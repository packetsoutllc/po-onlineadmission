import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage, GeminiContent } from "../types";

// FIX: Initializing GoogleGenAI inside function instead of top-level module scope to ensure fresh API_KEY retrieval
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// FIX: Using recommended model name
const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Converts internal ChatMessage state to the format required by the SDK.
 */
const formatHistory = (messages: ChatMessage[]): GeminiContent[] => {
  return messages.map((msg) => {
    const parts: any[] = [];
    
    // Add image if present
    // FIX: Using imageUrl to match the updated ChatMessage type in types.ts
    if (msg.imageUrl) {
      const mimeType = msg.imageUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      const base64Data = msg.imageUrl.split(',')[1];
      
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }

    // Add text
    if (msg.text) {
      parts.push({ text: msg.text });
    }

    return {
      // FIX: Use role directly if provided, or map from sender
      role: msg.role || (msg.sender === 'user' ? 'user' : 'model'),
      parts: parts
    };
  });
};

/**
 * Streams a response from Gemini based on the conversation history.
 */
export const streamGeminiResponse = async (
  history: ChatMessage[],
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
) => {
  try {
    // FIX: Create a new instance right before the call to adhere to performance and security guidelines
    const ai = getAI();
    const contents = formatHistory(history);

    const responseStream = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: contents,
      config: {
        systemInstruction: "You are a helpful, concise, and expert AI assistant. You can analyze images and answer complex questions.",
      }
    });

    for await (const chunk of responseStream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        onChunk(c.text);
      }
    }
    
    onComplete();
  } catch (err) {
    console.error("Gemini API Error:", err);
    onError(err instanceof Error ? err : new Error("Unknown error occurred"));
  }
};