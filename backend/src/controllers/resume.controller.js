const pdf = require('pdf-parse');
const Resume = require('../models/Resume.model');
const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');

// ─── POST /api/resumes/upload ─────────────────────────────────────
exports.uploadResume = async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a file.', 400));
  }

  const { path: fileUrl, originalname, filename, size, mimetype } = req.file;

  // Extract text from PDF for AI context
  let extractedText = null;
  let parseStatus = 'pending';

  try {
    if (mimetype === 'application/pdf') {
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfData = await pdf(buffer);
      extractedText = pdfData.text?.slice(0, 8000) ?? null; // Limit to 8k chars
      parseStatus = 'parsed';
    }
  } catch {
    parseStatus = 'failed';
  }

  const resume = await Resume.create({
    userId: req.user._id,
    fileName: filename,
    originalName: originalname,
    fileUrl,
    publicId: req.file.public_id || filename,
    fileSize: size,
    mimeType: mimetype,
    extractedText,
    parseStatus,
    isDefault: false,
  });

  // Auto-set as default if first resume
  const count = await Resume.countDocuments({ userId: req.user._id });
  if (count === 1) {
    resume.isDefault = true;
    await resume.save();
  }

  res.status(201).json({ success: true, resume });
};

// ─── GET /api/resumes ─────────────────────────────────────────────
exports.getMyResumes = async (req, res) => {
  const resumes = await Resume.find({ userId: req.user._id }).sort('-createdAt');
  res.status(200).json({ success: true, count: resumes.length, resumes });
};

// ─── DELETE /api/resumes/:id ──────────────────────────────────────
exports.deleteResume = async (req, res, next) => {
  const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
  if (!resume) return next(new AppError('Resume not found.', 404));

  // Delete from Cloudinary
  try {
    await cloudinary.uploader.destroy(resume.publicId, { resource_type: 'raw' });
  } catch {
    // Log but don't fail deletion
  }

  await resume.deleteOne();
  res.status(200).json({ success: true, message: 'Resume deleted successfully.' });
};

// ─── PATCH /api/resumes/:id/default ──────────────────────────────
exports.setDefaultResume = async (req, res, next) => {
  const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
  if (!resume) return next(new AppError('Resume not found.', 404));

  resume.isDefault = true;
  await resume.save(); // pre-save hook clears old defaults

  res.status(200).json({ success: true, message: 'Default resume updated.', resume });
};
