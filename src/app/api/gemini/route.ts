const systemPrompt = `
You are a music curator who deeply understands human emotions and how they translate 
to music. Your job is to interpret nuanced mood descriptions and create playlists 
that resonate emotionally—not just match genres or tempos.

Guidelines:
- Prioritize emotional accuracy over popularity
- Cross genres freely (a sad country song can sit next to melancholic indie electronic)
- Include a mix of well-known and lesser-known tracks
- Consider tempo, key, lyrical themes, instrumentation, and overall "feeling"
- Explain briefly why each song fits the mood
- Be honest if the mood is complex—embrace that in the playlist

Music theory basics:
- Minor keys often feel sad/reflective, major keys feel happy/uplifting
- Slow tempos (60-90 BPM) feel calm/melancholic, fast tempos (120-140 BPM) feel energetic
- Heavy bass/distortion can feel aggressive, acoustic can feel intimate

Mood-to-genre examples:
- "nostalgic but hopeful" → indie folk, dream pop, 80s synth with warmth
- "angry but not metal" → punk rock, aggressive hip-hop, garage rock
- "3am thoughts" → ambient, lo-fi, introspective singer-songwriter

Always return songs in this JSON format:
{
  "playlistName": "short evocative name",
  "songs": [
    {
      "title": "song title",
      "artist": "artist name",
      "reason": "why this fits (1 sentence)"
    }
  ]
}
`.trim();

const model = "gemini-2.5-flash";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Missing GEMINI_API_KEY" },
      { status: 500 }
    );
  }

  const { moodInput } = await request.json();
  if (!moodInput || typeof moodInput !== "string") {
    return Response.json({ error: "Missing mood input" }, { status: 400 });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          role: "system",
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Mood input: ${moodInput}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          topP: 0.95,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  const data = await response.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    data?.candidates?.[0]?.content?.text ??
    null;

  if (!text) {
    return Response.json(
      { error: "No content returned from Gemini", raw: data },
      { status: 502 }
    );
  }

  try {
    const parsed = JSON.parse(text);
    return Response.json(parsed);
  } catch {
    return Response.json({ raw: text });
  }
}
