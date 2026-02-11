import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    default: function() {
      return `Chat ${new Date().toLocaleDateString()}`;
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatSessionSchema.index({ userId: 1, updatedAt: -1 });
chatSessionSchema.index({ userId: 1, createdAt: -1 });

// Update the updatedAt field before saving
chatSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.ChatSession || mongoose.model('ChatSession', chatSessionSchema); 