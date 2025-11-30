import { SignJWT, jwtVerify } from 'jose';

export async function generateToken(payload: any, secret: string): Promise<string> {
    const secretKey = new TextEncoder().encode(secret);
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d') // 7 days expiration
        .sign(secretKey);
}

export async function verifyToken(token: string, secret: string): Promise<any | null> {
    try {
        const secretKey = new TextEncoder().encode(secret);
        const { payload } = await jwtVerify(token, secretKey);
        return payload;
    } catch (error) {
        return null;
    }
}
