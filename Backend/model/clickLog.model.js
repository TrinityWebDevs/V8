import mongoose from "mongoose";

const clickLogSchema = new mongoose.Schema({
    shortLink: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ShortLink",
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    ip: {
        type: String,
        required: true
    },
    referrer: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },
    browser: {
        type: String,
        default: null
    },
    os: {
        type: String,
        default: null
    },
    deviceType: {
        type: String,
        default: null
    },
    geo: {
        country:  { type: String },
        region:   { type: String },
        city:     { type: String }
    }
});

// Indexes for faster lookups
clickLogSchema.index({ shortLink: 1 });
clickLogSchema.index({ timestamp: 1 });

export default mongoose.model("ClickLog", clickLogSchema);