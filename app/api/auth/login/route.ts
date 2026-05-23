
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// In-memory rate limiter
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Placeholder creds to be replaced later
const DEMO_USER = {
    email: "admin@example.com",
    password: "password123",
    id: "usr_01",
    name: "Admin User",
    role: "admin",
};

export async function POST(req: NextRequest) {
    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    // Rate limiting
    const now = Date.now();
    const record = attempts.get(ip) ?? { count: 0, resetAt: now + WINDOW_MS };

    if (now > record.resetAt) {
        record.count = 0;
        record.resetAt = now + WINDOW_MS;
    }

    record.count++;
    attempts.set(ip, record);

    if (record.count > MAX_ATTEMPTS) {
        const retryAfter = Math.ceil((record.resetAt - now) / 1000);
        return NextResponse.json(
            {
                success: false,
                message: "Too many login attempts",
                retryAfter,
            },
            { status: 429 }
        );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
        return NextResponse.json(
            { success: false, message: "Email and password are required" },
            { status: 400 }
        );
    }

    if (
        email.toLowerCase() !== DEMO_USER.email ||
        password !== DEMO_USER.password
    ) {
        return NextResponse.json(
            { success: false, message: "Invalid email or password" },
            { status: 401 }
        );
    }

    // Reset attempts on successful login
    attempts.delete(ip);

    const secret = process.env.JWT_SECRET!;
    const token = jwt.sign(
        { id: DEMO_USER.id, email: DEMO_USER.email, role: DEMO_USER.role },
        secret,
        { expiresIn: "7d" }
    );
    return NextResponse.json({
        success: true,
        token,
        user: {
            id: DEMO_USER.id,
            email: DEMO_USER.email,
            name: DEMO_USER.name,
            role: DEMO_USER.role,
        },
    });
}