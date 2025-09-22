import OpenAI from 'openai';
import { config } from '../config.js';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export async function generateAIResponse(prompt) {
  try {
    if (!config.openai.apiKey) {
      return 'عذراً، خدمة الذكاء الاصطناعي غير مفعلة. يرجى إضافة OPENAI_API_KEY.';
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
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
      max_tokens: 500,
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return 'عذراً، حدث خطأ في الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.';
  }
}
