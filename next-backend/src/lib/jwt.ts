import * as jose from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "9a62aa5f17d3d2a71d6f5f9a62aa5f17d3d2a71d6f5f9a62aa5f17d3d2a71d6f5f";

function getSecretKeyBytes(): Uint8Array {
  try {
    const binaryStr = Buffer.from(JWT_SECRET, "base64");
    if (binaryStr.length >= 32) {
      return binaryStr;
    }
  } catch {
    // fallback to utf8
  }
  return new TextEncoder().encode(JWT_SECRET);
}

export interface TokenPayload {
  sub: string;
  userId: number;
  name: string;
  role: string;
  [key: string]: any;
}

export async function signJwt(payload: { userId: number; name: string; role: string; email: string }): Promise<string> {
  const secret = getSecretKeyBytes();
  const token = await new jose.SignJWT({
    userId: payload.userId,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.email)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);

  return token;
}

export async function verifyJwt(token: string): Promise<TokenPayload | null> {
  try {
    const secret = getSecretKeyBytes();
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    return {
      sub: payload.sub as string,
      userId: Number(payload.userId),
      name: payload.name as string,
      role: payload.role as string,
      ...payload,
    };
  } catch (err) {
    return null;
  }
}
