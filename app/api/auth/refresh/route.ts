import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { refreshToken } = body;
    if (!refreshToken) {
        return NextResponse.json(
            { success: false, message: "No refresh token" }, { status: 401 }
        );
    }
    try {
        const secret = process.env.JWT_SECRET!;
        const decoded = jwt.verify(refreshToken, secret) as { id: string };
        const accessToken = jwt.sign({ id: decoded.id }, secret, { expiresIn: "15m" });
        return NextResponse.json({ success: true, accessToken });
    } catch {
        return NextResponse.json({ success: false, message: "Invalid/Expired refresh token" }, { status: 401 })
    }
}