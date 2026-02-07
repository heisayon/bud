export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "Missing API Key" }, { status: 500 });

  const { moodInput, genrePreference, era, rating, ratingNotes } = await request.json();
  if (!moodInput || typeof moodInput !== "string") {
    return Response.json({ error: "Missing input" }, { status: 400 });
  }

  const systemPrompt = `You are "Bud," an elite music curator. 
  Your specialty is "Acoustic DNA Matching"—finding songs that share the same soul as a request.
  
  RULES:
  1. Exactly 20 songs.
  2. 70% "Hidden Gems" (lesser-known artists).
  3. Max 1 song per artist.
  4. VOICE: Speak like a human. Use imagery (rain, neon, 3am). 
     NO technical jargon like 'BPM' or 'production'.`;

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
    const ratingLine =
      typeof rating === "number" && Number.isFinite(rating)
        ? `User rating of the last playlist: ${rating}/5.`
        : "";
    const ratingGuidance =
      typeof rating === "number" && Number.isFinite(rating) && rating <= 3
        ? "Adjust closer to the user's mood and avoid generic choices."
        : "";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ 
            role: "user", 
            parts: [{ text: `User request: "${moodInput}". ${genrePreference || ""} ${era || ""} ${ratingLine} ${ratingGuidance} ${ratingNotes || ""}` }] 
          }],
          generationConfig: {
            temperature: 0.9,
            responseMimeType: "application/json",
            responseSchema: responseSchema // This keeps the JSON perfect
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
