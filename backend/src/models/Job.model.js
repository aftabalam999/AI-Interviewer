/**
 * models/Job.model.js
 *
 * Job Listing Schema for locally created/managed job postings.
 * Supports features like pinning, archiving, and featuring listings.
 */

const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
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
      default: 'Remote',
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    salaryMin: {
      type: Number,
      min: [0, 'Salary cannot be negative'],
      default: null,
    },
    salaryMax: {
      type: Number,
      min: [0, 'Salary cannot be negative'],
      default: null,
    },
    contractType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'internship', 'temporary'],
      default: 'full_time',
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    applyUrl: {
      type: String,
      default: '',
      trim: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to help search/filtering
jobSchema.index({ title: 'text', company: 'text', description: 'text' });

module.exports = mongoose.model('Job', jobSchema);
