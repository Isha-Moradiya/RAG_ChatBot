export class MemoryManager {
  constructor(limit = 20) {
    this.limit = limit;
    this.sessions = new Map(); 
  }

  _ensureSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }
  }

  addMessage(sessionId, { role, content }) {
    this._ensureSession(sessionId);
    const messages = this.sessions.get(sessionId);
    messages.push({ role, content });

    // Keep only last `limit` messages
    if (messages.length > this.limit) {
      messages.splice(0, messages.length - this.limit);
    }
  }

  getHistory(sessionId) {
    this._ensureSession(sessionId);
    return [...this.sessions.get(sessionId)];
  }

  clear(sessionId) {
    this.sessions.delete(sessionId);
  }
}
