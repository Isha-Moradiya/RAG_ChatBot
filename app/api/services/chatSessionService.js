import dbConnect from "../lib/mongodb";
import ChatSession from "../models/ChatSession";
import ChatMessage from "../models/ChatMessage";

// Create a new chat session
export const createSession = async (userId, sessionName = null) => {
  try {
    await dbConnect();

    const sessionData = {
      userId,
      name: sessionName || `Chat ${new Date().toLocaleDateString()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
      isActive: true,
    };

    const session = new ChatSession(sessionData);
    await session.save();

    console.log(`✅ Created new chat session: ${session._id} for user: ${userId}`);
    
    return {
      success: true,
      sessionId: session._id,
      session: session.toObject()
    };
  } catch (error) {
    console.error("Error creating chat session:", error);
    throw new Error("Failed to create chat session");
  }
};

// Get all chat sessions for a user
export const getUserSessions = async (userId, limit = 50) => {
  try {
    await dbConnect();

    const sessions = await ChatSession.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    return {
      success: true,
      sessions: sessions.map(session => ({
        id: session._id,
        ...session
      }))
    };
  } catch (error) {
    console.error("Error fetching user sessions:", error);
    throw new Error("Failed to fetch chat sessions");
  }
};

// Get a specific chat session with messages
export const getSession = async (userId, sessionId, messageLimit = 100) => {
  try {
    await dbConnect();

    // Get session data
    const session = await ChatSession.findOne({ _id: sessionId, userId }).lean();
    if (!session) {
      throw new Error("Session not found");
    }

    const sessionData = {
      id: session._id,
      ...session
    };

    // Get messages for this session
    const messages = await ChatMessage.find({ 
      userId, 
      sessionId 
    })
      .sort({ timestamp: 1 })
      .limit(messageLimit)
      .lean();

    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      ...msg,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
    }));

    return {
      success: true,
      session: sessionData,
      messages: formattedMessages
    };
  } catch (error) {
    console.error("Error fetching session:", error);
    throw new Error("Failed to fetch session");
  }
};

// Save a message to a session
export const saveMessage = async (userId, sessionId, message) => {
  try {
    await dbConnect();

    const messageData = {
      userId,
      sessionId,
      role: message.role || "user",
      text: message.content || message.text || "",
      attachments: message.attachments || [],
      timestamp: new Date()
    };

    const newMessage = new ChatMessage(messageData);
    await newMessage.save();

    // Update session message count and timestamp
    await ChatSession.findByIdAndUpdate(sessionId, {
      $inc: { messageCount: 1 },
      updatedAt: new Date()
    });

    return {
      success: true,
      message: newMessage.toObject()
    };
  } catch (error) {
    console.error("Error saving message:", error);
    throw new Error("Failed to save message");
  }
};

// Update session name
export const updateSessionName = async (userId, sessionId, newName) => {
  try {
    await dbConnect();

    const session = await ChatSession.findOneAndUpdate(
      { _id: sessionId, userId },
      { 
        name: newName,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!session) {
      throw new Error("Session not found");
    }

    return {
      success: true,
      session: session.toObject()
    };
  } catch (error) {
    console.error("Error updating session name:", error);
    throw new Error("Failed to update session name");
  }
};

// Delete a session and all its messages
export const deleteSession = async (userId, sessionId) => {
  try {
    await dbConnect();

    // Delete all messages in the session
    await ChatMessage.deleteMany({ userId, sessionId });

    // Delete the session
    const result = await ChatSession.findOneAndDelete({ _id: sessionId, userId });

    if (!result) {
      throw new Error("Session not found");
    }

    console.log(`✅ Deleted session: ${sessionId} and all messages for user: ${userId}`);

    return {
      success: true,
      message: "Session and all messages deleted successfully"
    };
  } catch (error) {
    console.error("Error deleting session:", error);
    throw new Error("Failed to delete session");
  }
};

// Get session statistics for a user
export const getSessionStats = async (userId) => {
  try {
    await dbConnect();

    const stats = await ChatSession.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalMessages: { $sum: "$messageCount" },
          activeSessions: { $sum: { $cond: ["$isActive", 1, 0] } },
          averageMessagesPerSession: { $avg: "$messageCount" }
        }
      }
    ]);

    const messageStats = await ChatMessage.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalUserMessages: { $sum: { $cond: [{ $eq: ["$role", "user"] }, 1, 0] } },
          totalModelMessages: { $sum: { $cond: [{ $eq: ["$role", "model"] }, 1, 0] } }
        }
      }
    ]);

    return {
      success: true,
      stats: {
        ...stats[0],
        ...messageStats[0]
      }
    };
  } catch (error) {
    console.error("Error fetching session stats:", error);
    throw new Error("Failed to fetch session statistics");
  }
};

// Search messages within a session
export const searchSessionMessages = async (userId, sessionId, query, limit = 10) => {
  try {
    await dbConnect();

    const messages = await ChatMessage.find({
      userId,
      sessionId,
      $text: { $search: query }
    })
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .lean();

    return {
      success: true,
      messages: messages.map(msg => ({
        id: msg._id,
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
      }))
    };
  } catch (error) {
    console.error("Error searching session messages:", error);
    throw new Error("Failed to search session messages");
  }
}; 