import { google } from "googleapis";

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

    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return Response.json(
        { error: "Missing YouTube credentials" },
        { status: 500 }
      );
    }

    const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2.getToken(code);
    oauth2.setCredentials(tokens);

    const userRef = adminDb.collection("users").doc(uid);
    const existing = await userRef.get();
    const prevRefreshToken = existing.data()?.integrations?.youtube?.refreshToken;

    await userRef.set(
      {
        integrations: {
          youtube: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token ?? prevRefreshToken,
            expiryDate: tokens.expiry_date,
            channelId: existing.data()?.integrations?.youtube?.channelId ?? null,
          },
        },
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return Response.json({ ok: true });
  } catch (error) {
    const apiError = error as {
      message?: string;
      response?: { data?: { error?: { message?: string } } };
    };
    const details =
      process.env.NODE_ENV === "development"
        ? apiError.response?.data?.error?.message ??
          apiError.message ??
          String(error)
        : undefined;
    return Response.json(
      { error: "YouTube token exchange failed", details },
      { status: 500 }
    );
  }
}
