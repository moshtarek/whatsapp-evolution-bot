import OpenAI from 'openai';
import { getAISettings } from '../models/settings.js';

export async function generateImage(prompt) {
  try {
    const settings = await getAISettings();
    
    // استخدام OpenAI API key لـ DALL-E
    const apiKey = settings.provider === 'openai' ? settings.apiKey : null;
    
    if (!apiKey) {
      return {
        success: false,
        error: 'يحتاج إنشاء الصور إلى مفتاح OpenAI API. يرجى إضافته في الإعدادات.'
      };
    }

    const openai = new OpenAI({
      apiKey: apiKey
    });

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard"
    });

    return {
      success: true,
      imageUrl: response.data[0].url,
      revisedPrompt: response.data[0].revised_prompt
    };

  } catch (error) {
    console.error('Image generation error:', error);
    
    if (error.code === 'insufficient_quota') {
      return {
        success: false,
        error: 'تم تجاوز حد استخدام DALL-E. يرجى التحقق من رصيد OpenAI.'
      };
    }
    
    return {
      success: false,
      error: 'عذراً، حدث خطأ في إنشاء الصورة. يرجى المحاولة مرة أخرى.'
    };
  }
}

export async function canGenerateImages() {
  try {
    const settings = await getAISettings();
    return settings.provider === 'openai' && settings.apiKey;
  } catch (error) {
    return false;
  }
}
