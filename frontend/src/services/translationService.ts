// type Language = 'english' | 'hinglish' | 'hindi';

// export async function translateToHindi(text: string, sourceLanguage: Language): Promise<string> {
//   try {
//     // If already Hindi, return as is
//     if (sourceLanguage === 'hindi') {
//       return text;
//     }

//     // Use Google Translate API via a simple CORS-friendly approach
//     const response = await fetch(
//       `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLanguage === 'hinglish' ? 'en' : 'en'}|hi`
//     );

//     const data = await response.json();

//     if (data.responseStatus === 200 && data.responseData.translatedText) {
//       return data.responseData.translatedText;
//     }

//     // Fallback: if translation fails, return original text
//     return text;
//   } catch (error) {
//     console.error('Translation error:', error);
//     // Return original text if translation fails
//     return text;
//   }
// }

type Language = "english" | "hinglish" | "hindi";

export async function translateToHindi(text: string, sourceLanguage: Language): Promise<string> {
  try {
    if (sourceLanguage === "hindi") return text;

    const chunks = chunkText(text);
    let finalResult = "";

    for (const chunk of chunks) {
      const response = await fetch("https://api.mymemory.translated.net/get", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          q: chunk,
          langpair: "en|hi"
        })
      });

      const data = await response.json();
      const translated = data?.responseData?.translatedText ?? chunk;

      finalResult += translated + " ";
    }

    return finalResult.trim();
  } catch (err) {
    console.error("Translation error", err);
    return text;
  }
}

// Same chunker function from above
function chunkText(text: string, maxLength = 400): string[] {
  const chunks = [];
  let current = "";

  for (const sentence of text.split(/(?<=[.?!।])/g)) {
    if ((current + sentence).length > maxLength) {
      chunks.push(current);
      current = sentence;
    } else {
      current += sentence;
    }
  }

  if (current.trim()) {
    chunks.push(current);
  }

  return chunks;
}
