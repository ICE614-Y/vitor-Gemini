export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });

  const { action, caption, style, extra, prompt, aspectRatio } = req.body;

  try {
    // ── ACTION 1: Generate image prompt from caption ──────────────────────
    if (action === 'prompt') {
      const instruction = `You are an expert social media image prompt writer for a Hong Kong AI education company called VPort AI (維港AI).

Analyse this social media caption and write ONE image generation prompt in English (max 100 words) that:
- Visually represents the caption's core message
- Visual style: ${style || 'professional corporate, clean and polished'}
- NO text, words, logos or signs anywhere in the image
- NO faces — use silhouettes, back-of-head angles, or hands only
- Subtle Hong Kong education context (classroom, school desk, books, technology)
- Dominant colors: deep navy blue (#0d1f35) and warm gold (#f0a500) accents
- Photorealistic or high-quality digital art
- Clean, professional composition suitable for social media marketing
${extra ? `- Additional requirement: ${extra}` : ''}

Caption:
${caption}

Reply with ONLY the image prompt text. No explanation, no preamble, no quotes.`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: instruction }] }],
          generationConfig: { maxOutputTokens: 250, temperature: 0.7 }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Gemini Flash error ' + response.status);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Gemini did not return text');
      return res.status(200).json({ prompt: text.trim() });
    }

    // ── ACTION 2: Generate image from prompt ─────────────────────────────
    if (action === 'image') {
      const models = ['imagen-3.0-generate-001', 'imagen-3.0-fast-generate-001'];
      let lastError = '';

      for (const model of models) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: {
              sampleCount: 1,
              aspectRatio: aspectRatio || '1:1',
              safetySetting: 'block_only_high',
              personGeneration: 'dont_allow'
            }
          })
        });

        const data = await response.json();

        if (!response.ok) {
          lastError = data.error?.message || 'Imagen error ' + response.status;
          const skip = response.status === 404 || lastError.includes('not found') || lastError.includes('deprecated');
          if (skip) continue;
          throw new Error(lastError);
        }

        const b64 = data.predictions?.[0]?.bytesBase64Encoded;
        if (!b64) { lastError = 'No image data returned'; continue; }
        return res.status(200).json({ image: b64, model });
      }

      throw new Error(lastError || 'All Imagen models failed');
    }

    return res.status(400).json({ error: 'Unknown action' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
