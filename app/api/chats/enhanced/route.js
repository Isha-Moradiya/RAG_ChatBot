import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "../../middleware/authMiddleware";
import { enhancedChatService } from "../../services/enhancedChatService";
import { rateLimit } from "../../lib/rateLimit";

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
    const {
      messages,
      sessionId,
      contextType = "document",
      documentId 
    } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { message: "Messages array is required" },
        { status: 400 }
      );
    }

    // ✅ Validate contextType
    const validContextTypes = ["document", "image", "both"];
    if (!validContextTypes.includes(contextType)) {
      return NextResponse.json(
        {
          message:
            "Invalid contextType. Must be 'document', 'image', or 'both'",
        },
        { status: 400 }
      );
    }

    // ✅ Call enhance chat service
    const result = await enhancedChatService(
      messages,
      userId,
      sessionId,
      contextType,
      documentId 
    );

    return NextResponse.json({
      success: true,
      reply: result.reply,
      documentsUsed: result.documentsUsed,
      sessionId: result.sessionId,
      sessionName: result.sessionName,
      contextType: result.contextType,
      hasImageContent: result.hasImageContent,
      hasDocumentContent: result.hasDocumentContent,
    });
  } catch (error) {
    console.error("Enhanced Chat API Error:", error);

    const isRateLimit = error.message?.includes("Too many requests");
    return NextResponse.json(
      {
        message: isRateLimit
          ? "Rate limit exceeded. Please try again later."
          : "Internal Server Error",
        error: error.message,
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
