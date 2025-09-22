import OpenAI from 'openai';
import { config } from '../config.js';

const client = new OpenAI({
  apiKey: config.openai.apiKey,
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function generateAIResponse(prompt) {
  try {
    if (!config.openai.apiKey) {
      return 'عذراً، خدمة الذكاء الاصطناعي غير مفعلة. يرجى إضافة GROQ_API_KEY.';
    }

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
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
  } catch (error) {
    console.error('Groq API Error:', error);
    return 'عذراً، حدث خطأ في الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.';
  }
}
