
import { GoogleGenAI, Modality, Type, Chat } from "@google/genai";
import { AIResponse, School, Staff, ScheduleEntry, UserProfile } from "../types";

// FIX: Corrected initialization to follow parameters guideline
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Basic text generation for the portal.
 */
export const generateText = async (prompt: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Text generation error:", error);
    throw error;
  }
};

/**
 * Grounded text generation using Google Search.
 */
export const generateGroundedText = async (prompt: string): Promise<{ text: string; sources: { uri: string; title?: string }[] }> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const sources: { uri: string; title?: string }[] = [];
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (Array.isArray(chunks)) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          sources.push({ uri: chunk.web.uri, title: chunk.web.title });
        }
      });
    }

    return { text, sources };
  } catch (error) {
    console.error("Grounded text generation error:", error);
    throw error;
  }
};

/**
 * Reviews an admission essay and provides feedback.
 */
export const reviewAdmissionEssay = async (essay: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Critically review this admission essay and suggest 3 ways to improve it for a high school application:\n\n${essay}`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Essay review error:", error);
    return "Could not analyze the essay.";
  }
};

/**
 * Generates speech from text for the Support Connect interface.
 */
export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{
          parts: [{ text: text }]
      }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio content returned from API");
    
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};

/**
 * Analyzes an image with a prompt (e.g., Passport photo verification).
 */
export const analyzeImage = async (base64Data: string, mimeType: string, prompt: string): Promise<string> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data
                        }
                    },
                    {
                        text: prompt
                    }
                ]
            }
        });
        return response.text || "";
    } catch (error) {
        console.error("Error analyzing image:", error);
        throw error;
    }
};

/**
 * Helper to convert a file to a base64 string for API calls.
 */
export const fileToGenerativePart = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = (reader.result as string).split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const createChatSession = (): Chat => {
  const ai = getAI();
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
  });
};

export const getChatResponse = async (prompt: string): Promise<string> => {
    return generateText(prompt);
};

export const getSchoolRecommendations = async (query: string, allSchools: School[]): Promise<{ recommendations: string[], explanation: string }> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on the user's query: "${query}", recommend matching schools from this list: ${JSON.stringify(allSchools)}.
      Return a JSON object with:
      - recommendations: array of school IDs
      - explanation: a short reason for these matches`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            explanation: { type: Type.STRING },
          },
          required: ['recommendations', 'explanation']
        }
      }
    });
    return JSON.parse(response.text || '{"recommendations":[], "explanation":""}');
  } catch (error) {
    return { recommendations: [], explanation: "Failed to get AI recommendations." };
  }
};

export const improveEssay = async (essay: string, schoolName: string): Promise<AIResponse> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Critique and improve this admission essay for ${schoolName}. Provide both a feedback summary and an improved version of the text:\n\n${essay}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            improvedText: { type: Type.STRING },
            feedback: { type: Type.STRING },
          },
          required: ['improvedText', 'feedback']
        }
      }
    });
    return JSON.parse(response.text || '{"improvedText":"", "feedback":""}');
  } catch (error) {
    return { improvedText: essay, feedback: "AI service unavailable." };
  }
};

// FIX: Added missing exported member 'enhanceText'
export const enhanceText = async (text: string, context: string): Promise<string> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Improve the following text for a professional resume in the context of ${context}:\n\n${text}`,
        });
        return response.text || text;
    } catch (error) {
        console.error("Enhance text error:", error);
        return text;
    }
};

// FIX: Added missing exported member 'generateSummary'
export const generateSummary = async (jobTitle: string, skills: string[]): Promise<string> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a 3-sentence professional resume summary for a ${jobTitle} with these skills: ${skills.join(', ')}`,
        });
        return response.text || "";
    } catch (error) {
        console.error("Generate summary error:", error);
        return "";
    }
};

// FIX: Added missing exported member 'generateRosterWithAI'
export const generateRosterWithAI = async (staff: Staff[], year: number, month: number, existingSchedule: ScheduleEntry[]): Promise<ScheduleEntry[]> => {
    try {
        const ai = getAI();
        const prompt = `Generate a balanced roster for ${staff.length} staff members for the month ${month + 1}, ${year}. 
        Return a JSON array of ScheduleEntry objects.
        Staff: ${JSON.stringify(staff.map(s => ({id: s.id, role: s.role})))}
        Existing: ${JSON.stringify(existingSchedule)}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            staffId: { type: Type.STRING },
                            date: { type: Type.STRING },
                            shiftType: { type: Type.STRING },
                            synced: { type: Type.BOOLEAN }
                        }
                    }
                }
            }
        });
        return JSON.parse(response.text || '[]');
    } catch (error) {
        console.error("Generate roster error:", error);
        return [];
    }
};

// FIX: Added missing exported member 'getAgentInstructions'
export const getAgentInstructions = async (html: string, profile: UserProfile): Promise<{ thoughts: string, actions: { fieldId: string, value: any, reason: string }[], submitButtonId?: string }> => {
    try {
        const ai = getAI();
        const prompt = `Page HTML:\n${html}\n\nUser Profile Data:\n${JSON.stringify(profile)}\n\nAnalyze the HTML and determine how to fill the form using the profile. Return valid JSON.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        thoughts: { type: Type.STRING },
                        actions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    fieldId: { type: Type.STRING },
                                    value: { type: Type.STRING },
                                    reason: { type: Type.STRING }
                                }
                            }
                        },
                        submitButtonId: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (error) {
        console.error("Agent instructions error:", error);
        throw error;
    }
};
