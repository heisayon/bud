import { adminAuth } from "@/lib/firebase/admin";

export async function verifyUser(authorization?: string | null) {
  if (!authorization) {
    throw new Error("Missing authorization header");
  }

  const token = authorization.replace("Bearer ", "").trim();
  if (!token) {
    throw new Error("Missing token");
  }

  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}
