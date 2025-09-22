// تحليل رد الذكاء الاصطناعي للبحث عن صور أو طلبات إنشاء صور

export function parseAIResponse(response) {
  const result = {
    hasImages: false,
    images: [],
    text: response,
    needsImageGeneration: false,
    imagePrompt: null
  };

  // البحث عن روابط الصور في الرد
  const imageUrlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp))/gi;
  const imageUrls = response.match(imageUrlRegex);
  
  if (imageUrls) {
    result.hasImages = true;
    result.images = imageUrls;
  }

  // البحث عن طلبات إنشاء الصور
  const imageRequestPatterns = [
    /ارسم\s+(.+)/i,
    /اصنع\s+صورة\s+(.+)/i,
    /أنشئ\s+صورة\s+(.+)/i,
    /draw\s+(.+)/i,
    /create\s+image\s+(.+)/i,
    /generate\s+image\s+(.+)/i
  ];

  for (const pattern of imageRequestPatterns) {
    const match = response.match(pattern);
    if (match) {
      result.needsImageGeneration = true;
      result.imagePrompt = match[1];
      break;
    }
  }

  return result;
}

export function shouldGenerateImage(userPrompt) {
  const imageKeywords = [
    'ارسم', 'اصنع صورة', 'أنشئ صورة', 'صورة', 'رسمة',
    'draw', 'create image', 'generate image', 'picture', 'photo'
  ];

  return imageKeywords.some(keyword => 
    userPrompt.toLowerCase().includes(keyword.toLowerCase())
  );
}
