import OpenAI from 'openai';
import { config } from '../config.js';
import { getAISettings, updateAISettings } from '../models/settings.js';

// محركات الذكاء الاصطناعي المدعومة
const AI_PROVIDERS = {
  groq: {
    name: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    models: ['llama-3.1-8b-instant', 'llama-3.1-70b-versatile', 'mixtral-8x7b-32768'],
    free: true
  },
  openai: {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    free: false
  },
  deepseek: {
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-coder'],
    free: false
  },
  gemini: {
    name: 'Google Gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    free: true
  }
};

export async function generateAIResponse(prompt) {
  try {
    const settings = await getAISettings();
    const provider = settings.provider || 'groq';
    const model = settings.model || 'llama-3.1-8b-instant';
    const apiKey = settings.apiKey || config.openai.apiKey;

    if (!apiKey) {
      return `عذراً، لم يتم تكوين مفتاح API لـ ${AI_PROVIDERS[provider]?.name || provider}. يرجى إضافة المفتاح في الإعدادات.`;
    }

    if (provider === 'groq' || provider === 'openai' || provider === 'deepseek') {
      return await generateOpenAICompatibleResponse(provider, model, apiKey, prompt);
    } else if (provider === 'gemini') {
      return await generateGeminiResponse(model, apiKey, prompt);
    }

    return 'عذراً، محرك الذكاء الاصطناعي المحدد غير مدعوم.';
  } catch (error) {
    console.error('AI API Error:', error);
    return 'عذراً، حدث خطأ في الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.';
  }
}

async function generateOpenAICompatibleResponse(provider, model, apiKey, prompt) {
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: AI_PROVIDERS[provider].baseURL,
  });

  const completion = await client.chat.completions.create({
    model: model,
    messages: [
      {
        role: "system",
        content: "أنت مساعد ذكي يساعد في كتابة النصوص باللغة العربية. اكتب بأسلوب مهني ومناسب."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 1500,
    temperature: 0.7,
  });

  return completion.choices[0].message.content;
}

async function generateGeminiResponse(model, apiKey, prompt) {
  // تنفيذ Gemini API (مبسط)
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `أنت مساعد ذكي يساعد في كتابة النصوص باللغة العربية. اكتب بأسلوب مهني ومناسب.\n\n${prompt}`
        }]
      }]
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('Gemini API Error:', data);
    return `عذراً، خطأ في Gemini API: ${data.error?.message || 'خطأ غير معروف'}`;
  }
  
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'عذراً، لم أتمكن من الحصول على رد من Gemini.';
}

export function getAvailableProviders() {
  return AI_PROVIDERS;
}
