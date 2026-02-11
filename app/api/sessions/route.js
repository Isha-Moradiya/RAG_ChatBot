import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "../middleware/authMiddleware";
import { rateLimit } from "../lib/rateLimit";
import {
  createSession,
  getUserSessions,
  getSession,
  saveMessage,
  updateSessionName,
  deleteSession,
  getSessionStats,
  searchSessionMessages,
} from "../services/chatSessionService";

// 🟢 GET - Fetch sessions / single session / search
export async function GET(request) {
  try {
    // ✅ Authenticate
    const authResult = await verifyFirebaseToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.message },
        { status: 401 }
      );
    }
    const userId = authResult.user.uid;

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const limit = parseInt(searchParams.get("limit")) || 50;
    const messageLimit = parseInt(searchParams.get("messageLimit")) || 100;
    const query = searchParams.get("query");

    let result;
    if (sessionId && query) {
      result = await searchSessionMessages(userId, sessionId, query, limit);
    } else if (sessionId) {
      result = await getSession(userId, sessionId, messageLimit);
    } else {
      result = await getUserSessions(userId, limit);
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// 🟢 POST - Create session or save message
export async function POST(request) {
  try {
    // ✅ Authenticate
    const authResult = await verifyFirebaseToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.message },
        { status: 401 }
      );
    }
    const userId = authResult.user.uid;

    // ✅ Rate limit
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
    const { sessionName } = await request.json();
    if (!sessionName || typeof sessionName !== "string") {
      return NextResponse.json(
        { message: "Valid sessionName is required" },
        { status: 400 }
      );
    }

    // ✅ Create session
    const result = await createSession(userId, sessionName);
    return NextResponse.json(result);
  } catch (error) {
    const status = error.message?.includes("Rate limit") ? 429 : 500;
    return NextResponse.json({ message: error.message }, { status });
  }
}

// 🟢 PUT - Update session name
export async function PUT(request) {
  try {
    const authResult = await verifyFirebaseToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.message },
        { status: 401 }
      );
    }
    const userId = authResult.user.uid;

    // ✅ Parse and validate body
    const { sessionId, sessionName } = await request.json();
    if (
      !sessionId ||
      typeof sessionId !== "string" ||
      !sessionName ||
      typeof sessionName !== "string"
    ) {
      return NextResponse.json(
        { message: "Valid sessionId and sessionName are required" },
        { status: 400 }
      );
    }

    // ✅ Update session name
    const result = await updateSessionName(userId, sessionId, sessionName);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// 🟢 DELETE - Delete session
export async function DELETE(request) {
  try {
    const authResult = await verifyFirebaseToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.message },
        { status: 401 }
      );
    }
    const userId = authResult.user.uid;

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json(
        { message: "sessionId is required" },
        { status: 400 }
      );
    }

    const result = await deleteSession(userId, sessionId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
