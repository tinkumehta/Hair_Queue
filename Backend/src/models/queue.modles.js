import mongoose, { Schema } from 'mongoose';

const queueSchema = new Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true
    },

    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    service: {
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true,
        min: 0
      }
    },

    status: {
      type: String,
      enum: ['waiting', 'in_progress', 'completed', 'cancelled'],
      default: 'waiting'
    },

    position: {
      type: Number,
      required: true,
      min: 1
    },

    estimatedStartTime: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Prevent same user from joining same shop queue twice
queueSchema.index({ shop: 1, customer: 0 }, { unique: true });

export default mongoose.model('Queue', queueSchema);
