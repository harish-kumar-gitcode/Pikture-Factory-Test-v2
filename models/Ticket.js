import mongoose from 'mongoose';

const ReplySchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    author: { type: String, default: 'Admin' },
  },
  { timestamps: true }
);

const TicketSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'follow_up', 'closed'],
      default: 'open',
    },
    replies: [ReplySchema],
    seenByAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);
