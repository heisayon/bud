import SpotifyWebApi from "spotify-web-api-node";

import { adminDb } from "@/lib/firebase/admin";
import { verifyUser } from "@/lib/firebase/verify";

export async function POST(request: Request) {
  try {
    const uid = await verifyUser(request.headers.get("authorization"));
    const { code, redirectUri } = await request.json();

    if (!code || !redirectUri) {
      return Response.json(
        { error: "Missing code or redirectUri" },
        { status: 400 }
      );
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return Response.json(
        { error: "Missing Spotify credentials" },
        { status: 500 }
      );
    }

    const spotifyApi = new SpotifyWebApi({
      clientId,
      clientSecret,
      redirectUri,
    });

    const tokenData = await spotifyApi.authorizationCodeGrant(code);
    spotifyApi.setAccessToken(tokenData.body.access_token);
    spotifyApi.setRefreshToken(tokenData.body.refresh_token);

    const me = await spotifyApi.getMe();

    await adminDb.collection("users").doc(uid).set(
      {
        integrations: {
          spotify: {
            accessToken: tokenData.body.access_token,
            refreshToken: tokenData.body.refresh_token,
            expiresAt: Date.now() + tokenData.body.expires_in * 1000,
            userId: me.body.id,
          },
        },
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: "Spotify token exchange failed" }, { status: 500 });
  }
}
