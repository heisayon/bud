export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "Missing API Key" }, { status: 500 });

  const { moodInput, genrePreference, era, rating, ratingNotes } = await request.json();
  if (!moodInput || typeof moodInput !== "string") {
    return Response.json({ error: "Missing input" }, { status: 400 });
  }

const systemPrompt = `You are "Bud," an elite music curator. 
Your specialty is "Acoustic DNA Matching"—finding songs that share the same soul as a request.

CRITICAL RULES:
1. Exactly over 10 songs. MUST NOT BE LESS THAN OR EQUAL TO 10 SONGS. MORE WILL BE APPRECIATED BUT DON'T EXCEED 30 SONGS.
2. If user mentions a SPECIFIC ARTIST NAME (like "Rema", "Drake", "Taylor Swift"), ONLY include songs by that artist.
3. If user says "album" with an artist name, pull songs from their actual albums.
4. If it's a general mood/vibe request, follow these rules:
   - 70% "Hidden Gems" (lesser-known artists)
   - Max 1 song per artist
5. VOICE: Speak like a human. Use imagery (rain, neon, 3am). 
   NO technical jargon like 'BPM' or 'production'.

PLAYLIST NAMING (SUPER IMPORTANT):
- Use the USER'S EXACT WORDS when possible
- Keep it SHORT and REAL (2-4 words max)
- NO poetic metaphors like "Velvet Tears", "Midnight Whispers", "Purple Dreams"
- NO generic phrases like "Chill Vibes", "Mood Boost", "Late Night Feels"

GOOD PLAYLIST NAMES:
- User: "feeling sad" → Name: "sad rn"
- User: "3am and can't sleep" → Name: "3am thoughts"
- User: "give me a Rema album" → Name: "rema hits"
- User: "hype workout music" → Name: "workout hype"
- User: "nostalgic 90s vibes" → Name: "90s nostalgia"
- User: "heartbreak songs" → Name: "heartbreak playlist"

BAD PLAYLIST NAMES (NEVER):
- ❌ "Velvet Tears"
- ❌ "Midnight Reverie"
- ❌ "Ethereal Soundscapes"
- ❌ "Melancholic Dreamscape"

SONG SELECTION EXAMPLES:
- "give me a Rema album" → ALL 20 songs by Rema only
- "songs like Calm Down by Rema" → Similar vibe artists + a few Rema songs
- "feeling sad" → Mix of artists following the 70% hidden gems rule
- "90s hip hop classics" → 90s hip hop only, can have multiple songs per artist if classic albums
- "energetic workout music" → High energy, multiple artists, hidden gems focus

VIBE ANALYSIS:
Write a brief (2-3 sentences) "vibe analysis" explaining the emotional thread of this playlist.
Use poetic language - think "This is for 3am drives when you're replaying conversations" 
not "This playlist has energetic songs with upbeat tempo".`;

  const responseSchema = {
    type: "object",
    properties: {
      playlistName: { type: "string" },
      vibeAnalysis: { type: "string" },
      songs: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            artist: { type: "string" },
            reason: { type: "string" }
          },
          required: ["title", "artist", "reason"]
        }
      }
    },
    required: ["playlistName", "vibeAnalysis", "songs"]
  };

  try {
    const ratingContext = (() => {
      if (typeof rating !== "number" || !Number.isFinite(rating)) return "";
      
      if (rating <= 2) {
        return `\n\nIMPORTANT: User rated last playlist ${rating}/5 (Poor). ${ratingNotes ? `Feedback: "${ratingNotes}".` : ""} 
ADJUST: Be MORE specific to their mood, include MORE hidden gems, avoid mainstream picks.`;
      } else if (rating === 3) {
        return `\n\nUser rated last playlist ${rating}/5 (Okay). ${ratingNotes ? `Feedback: "${ratingNotes}".` : ""} 
ADJUST: They want something different - try different subgenres or deeper cuts.`;
      } else if (rating >= 4) {
        return `\n\nUser rated last playlist ${rating}/5 (Good/Excellent). ${ratingNotes ? `Feedback: "${ratingNotes}".` : ""} 
Keep similar vibe but add fresh variety.`;
      }
      return "";
    })();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ 
            role: "user", 
            parts: [{ text: `User request: "${moodInput}". ${genrePreference || ""} ${era || ""}${ratingContext}` }] 
          }],
          generationConfig: {
            temperature: 0.9,
            responseMimeType: "application/json",
            responseSchema: responseSchema
          },
        }),
      }
    );

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) throw new Error("AI returned no content");

    return Response.json(JSON.parse(content));

  } catch (error: any) {
    console.error("Fetch Error:", error);
    return Response.json({ error: "Failed to generate" }, { status: 500 });
  }
}