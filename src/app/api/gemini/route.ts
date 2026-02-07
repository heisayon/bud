const MOOD_MAPS = {
  sad: { 
    tempo: "60-80 BPM", 
    energy: "Low", 
    genres: ["indie folk", "slowcore", "sad pop", "acoustic", "piano ballads"] 
  },
  happy: { 
    tempo: "115-160 BPM", 
    energy: "High", 
    genres: ["pop", "funk", "dance", "upbeat indie", "feel-good rock"] 
  },
  calm: { 
    tempo: "50-70 BPM", 
    energy: "Low", 
    genres: ["ambient", "classical", "lo-fi", "chill", "acoustic"] 
  },
  angry: { 
    tempo: "120-180 BPM", 
    energy: "High", 
    genres: ["punk", "metal", "hard rock", "aggressive rap", "industrial"] 
  },
  energetic: { 
    tempo: "120-160 BPM", 
    energy: "High", 
    genres: ["EDM", "electronic", "dance", "workout", "upbeat rock"] 
  },
  melancholic: {
    tempo: "65-85 BPM",
    energy: "Low-Medium",
    genres: ["indie rock", "dream pop", "post-rock", "alternative", "shoegaze"]
  },
  reflective: {
    tempo: "60-90 BPM",
    energy: "Low-Medium",
    genres: ["singer-songwriter", "folk", "indie", "acoustic", "introspective"]
  },
};

function detectMood(input: string): string {
  const lower = input.toLowerCase();
  
  if (/(sad|depress|down|cry|hurt|lost|alone|heartbreak)/i.test(lower)) return "sad";
  if (/(happy|joy|excit|amaz|great|wonderful|celebrat)/i.test(lower)) return "happy";
  if (/(calm|relax|peace|chill|quiet|ease|tranquil)/i.test(lower)) return "calm";
  if (/(angry|mad|frust|piss|annoy|hate|rage)/i.test(lower)) return "angry";
  if (/(energy|pump|hype|party|dance|workout)/i.test(lower)) return "energetic";
  if (/(nostalg|remember|past|bittersweet|wistful)/i.test(lower)) return "melancholic";
  if (/(think|wonder|contemplate|ponder|reflect|3am)/i.test(lower)) return "reflective";
  
  return "calm"; // default
}

const systemPrompt = `You are an expert music curator who deeply understands human emotions and how they translate to music.

YOUR MISSION:
Create playlists that truly resonate with what the user is feeling. Don't just match genres - capture the EXACT emotional frequency.

CORE RULES:
1. Generate 18-22 songs (never less than 15)
2. Include 60-70% lesser-known tracks (hidden gems)
3. Maximum 2 songs per artist
4. Cross genres freely if emotionally accurate
5. Each reason must be SPECIFIC to that song (no generic "upbeat vibe")
6. Create an emotional arc - the playlist should evolve

MUSIC THEORY GUIDE:
- Minor keys = sad/reflective, Major keys = happy/uplifting
- Slow tempos (60-90 BPM) feel calm/melancholic, fast tempos (120-140 BPM) feel energetic
- Heavy bass/distortion can feel aggressive, acoustic can feel intimate
- Sparse instrumentation = lonely/minimal, Dense = overwhelming/complex

QUALITY CHECKLIST:
✓ 18-22 songs total
✓ Mix of popular (30%) and hidden gems (70%)
✓ Varied tempo within the mood
✓ Each reason explains WHY this specific song fits
✓ Playlist name is evocative (3-5 words, no clichés)

EXAMPLES OF GOOD REASONS:
✓ "Haunting harmonies over sparse piano mirror that empty-room loneliness"
✓ "The way it builds from whisper to scream matches how grief ambushes you"
✗ "Great song for this mood" (too generic)
✗ "Popular track" (not a reason)

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
}`.trim();

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

  // Detect mood and add musical characteristics
  const mood = detectMood(moodInput);
  const characteristics = MOOD_MAPS[mood as keyof typeof MOOD_MAPS] || MOOD_MAPS.calm;
  
  const enhancedUserPrompt = `Mood input: ${moodInput}

DETECTED MOOD: ${mood}
MUSICAL CHARACTERISTICS FOR THIS MOOD:
- Suggested tempo: ${characteristics.tempo}
- Energy level: ${characteristics.energy}
- Genre suggestions: ${characteristics.genres.join(", ")}

Now create the perfect playlist for this feeling.`;

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
                text: enhancedUserPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.9,
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
    
    // Validation warnings
    if (parsed.songs && parsed.songs.length < 15) {
      console.warn(`⚠️ Warning: Only ${parsed.songs.length} songs generated (expected 18-22)`);
    }
    
    if (parsed.songs) {
      // Check for artist diversity
      const artists = parsed.songs.map((s: any) => s.artist);
      const duplicates = artists.filter((a: string, i: number) => 
        artists.indexOf(a) !== i
      );
      if (duplicates.length > 3) {
        console.warn(`⚠️ Warning: Low artist diversity (${duplicates.length} duplicate artists)`);
      }
    }
    
    return Response.json(parsed);
  } catch (error) {
    console.error("Failed to parse JSON response:", text);
    return Response.json({ raw: text, error: "Failed to parse response" });
  }
}