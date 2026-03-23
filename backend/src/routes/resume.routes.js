const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const {
  uploadResume,
  getMyResumes,
  deleteResume,
  setDefaultResume,
} = require('../controllers/resume.controller');

router.use(protect);

router.post('/upload', upload.single('resume'), uploadResume);
router.get('/', getMyResumes);
router.delete('/:id', deleteResume);
router.patch('/:id/default', setDefaultResume);

module.exports = router;
