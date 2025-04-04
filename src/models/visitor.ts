import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
  visitorId: {
    type: String,
    required: true,
    unique: true
  },
  ipHistory: [
    {
      ip: {
        type: String,
        required: true
      },
      changedAt: {
        type: Date,
        default: Date.now
      },
    }
  ],
  country: {
    type: String,
    required: true,
    default: "KR"
  },
  userAgent: String,
  referrer: String,
  path: String,
  tracking:[
    {
      path: String,
      stay: Number,
      visitedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  device: {
    type: String
  },
  browser: {
    type: String
  },
  visitCount: {
    type: Number,
    default: 1
  },
  lastVisit: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});

module.exports = mongoose.model('Visitor', visitorSchema);