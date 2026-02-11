import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "../middleware/authMiddleware";
import { chatService } from "../services/chatService";
import { rateLimit } from "../lib/rateLimit";

export async function POST(request) {
  try {
    // ✅ Authenticate user
    const authResult = await verifyFirebaseToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.message },
        { status: 401 }
      );
    }
    const userId = authResult.user.uid;

    // ✅ Rate limit check
    const limitResult = rateLimit(userId, 20);
    if (!limitResult.success) {
      return NextResponse.json(
        {
          message: `Rate limit exceeded. Try again in ${limitResult.retryAfter} seconds.`,
        },
        { status: 429 }
      );
    }

    // ✅ Parse and validate body
    const { messages, sessionId } = await request.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { message: "Invalid messages array" },
        { status: 400 }
      );
    }

    // ✅ Call chat service
    const result = await chatService(messages, userId, sessionId);

    return NextResponse.json(result);
  } catch (error) {
    const status = error.message?.includes("Rate limit") ? 429 : 500;
    return NextResponse.json({ message: error.message }, { status });
  }
}
