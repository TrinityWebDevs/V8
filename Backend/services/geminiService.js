import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' }); 
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not found in .env file. AI features will be disabled.');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const modelConfig = {
  model: 'gemini-1.5-flash', 
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ],
  generationConfig: {
    maxOutputTokens: 1000, 
    temperature: 0.7,      
    topP: 0.9,
    topK: 40,
  },
};

async function getGeminiResponse(currentPrompt, history = []) {
  if (!genAI) {
    console.error('Gemini AI client not initialized. Missing API key or client setup failed.');
    return 'AI service is currently unavailable.';
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);
    
    const chat = model.startChat({
      history: history,
      safetySettings: modelConfig.safetySettings,
    });

    const result = await chat.sendMessage(currentPrompt);
    const response = await result.response;
    

    if (response && typeof response.text === 'function') {
      const text = response.text();
      return text;
    } else if (response && response.promptFeedback && response.promptFeedback.blockReason) {
      console.warn(`[Gemini Service] Request blocked due to: ${response.promptFeedback.blockReason}`);
      return `I'm sorry, but your request was blocked due to: ${response.promptFeedback.blockReason}. Please rephrase your request.`;
    } else {
      console.error('[Gemini Service] Unexpected response structure or no text:', response);
      return 'Sorry, I received an unexpected or empty response from the AI.';
    }
  } catch (error) {
    console.error('[Gemini Service Error] Error generating content:', error);
    let errorMessage = 'Sorry, I encountered an error trying to respond.';
    if (error.message) {
      if (error.message.includes('API key not valid')) {
        errorMessage = 'AI service error: Invalid API Key. Please check server configuration.';
      }
      if (error.message.includes('quota')) {
        errorMessage = 'AI service error: Quota exceeded. Please check your Gemini API plan.';
      }
      if (error.message.includes('timed out')) {
        errorMessage = 'AI service error: The request to Gemini API timed out.';
      }
    }
    if (error.toString().includes('SAFETY')) { 
        errorMessage = "I'm sorry, but I cannot respond to that due to safety guidelines.";
    }
    return errorMessage;
  }
}

export { getGeminiResponse };