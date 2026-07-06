'use strict';

const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    adzunaId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    salaryMin: {
      type: Number,
      default: null,
    },
    salaryMax: {
      type: Number,
      default: null,
    },
    category: {
      type: String,
      trim: true,
      default: null,
    },
    contractType: {
      type: String,
      trim: true,
      default: null, // e.g. full_time, part_time, contract, permanent
    },
    redirectUrl: {
      type: String,
      required: [true, 'Redirect/Apply URL is required'],
      trim: true,
    },
    source: {
      type: String,
      default: 'Adzuna',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    postedTime: {
      type: Date,
      default: Date.now,
    },
    // Supporting Scraper Module Fields (Sparse / Optional)
    jobHash: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    experience: {
      type: String,
      default: 'Not Specified',
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

// ─── Indexes ──────────────────────────────────────────────────────

// Text Index for full-text search optimization on title, description, and skills
jobSchema.index(
  { title: 'text', description: 'text', skills: 'text' },
  { weights: { title: 10, skills: 5, description: 1 }, name: 'JobTextIndex' }
);

// Filtering & sorting optimization indexes
jobSchema.index({ company: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ contractType: 1 });
jobSchema.index({ source: 1 });
jobSchema.index({ isActive: 1 });
jobSchema.index({ createdAt: -1 });

// Cache invalidation hooks
const { clearJobsCache } = require('../config/redis');
const triggerCacheClear = () => {
  clearJobsCache().catch((err) => {
    console.error('[JobModel] Cache clearing error:', err.message);
  });
};

jobSchema.post('save', triggerCacheClear);
jobSchema.post('insertMany', triggerCacheClear);
jobSchema.post('findOneAndUpdate', triggerCacheClear);
jobSchema.post('updateMany', triggerCacheClear);
jobSchema.post('deleteOne', triggerCacheClear);
jobSchema.post('deleteMany', triggerCacheClear);

module.exports = mongoose.model('Job', jobSchema);
