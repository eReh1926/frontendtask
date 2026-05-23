import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
            { success: false, message: "No token provided" },
            { status: 401 }
        );
    }

    const token = authHeader.split(" ")[1];

    try {
        const secret = process.env.JWT_SECRET!;
        const decoded = jwt.verify(token, secret);

        return NextResponse.json({ success: true, user: decoded });
    } catch {
        return NextResponse.json(
            { success: false, message: "Invalid or expired token" },
            { status: 401 }
        );
    }
}