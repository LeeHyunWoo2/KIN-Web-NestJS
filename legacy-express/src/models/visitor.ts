import { Schema, model, models } from "mongoose";
import { VisitorTypes } from "@/types/Visitor";

const VisitorSchema = new Schema<VisitorTypes>({
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

export default models.Visitor || model<VisitorTypes>("Visitor", VisitorSchema);