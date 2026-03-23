import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Trash2, Star, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { resumeAPI } from '@/services/api';
import toast from 'react-hot-toast';

const PARSE_STATUS = {
  pending: { label: 'Processing', cls: 'badge-warning', icon: Loader2 },
  parsed:  { label: 'Text extracted', cls: 'badge-success', icon: CheckCircle },
  failed:  { label: 'Parse failed', cls: 'badge-danger', icon: AlertCircle },
};

export default function ResumesPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchResumes = () => {
    resumeAPI.getAll()
      .then(({ data }) => setResumes(data.resumes || []))
      .finally(() => setLoading(false));
  };

  useEffect(fetchResumes, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const { data } = await resumeAPI.upload(formData);
      setResumes((prev) => [data.resume, ...prev]);
      toast.success(`"${file.name}" uploaded successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resume?')) return;
    setDeleting(id);
    try {
      await resumeAPI.delete(id);
      setResumes((prev) => prev.filter((r) => r._id !== id));
      toast.success('Resume deleted');
    } catch {
      toast.error('Failed to delete resume');
    } finally {
      setDeleting(null);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await resumeAPI.setDefault(id);
      setResumes((prev) => prev.map((r) => ({ ...r, isDefault: r._id === id })));
      toast.success('Default resume updated');
    } catch {
      toast.error('Failed to update default');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-white">My Resumes</h2>
        <p className="text-slate-400 mt-1">Upload your resume so AI can personalize your interview questions.</p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-brand-500 bg-brand-600/10' : 'border-surface-border hover:border-brand-500/60 hover:bg-surface-hover'}
          ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
          ) : (
            <div className={`p-4 rounded-2xl ${isDragActive ? 'bg-brand-600/30' : 'bg-surface-border/50'} transition-colors`}>
              <Upload className={`w-8 h-8 ${isDragActive ? 'text-brand-400' : 'text-slate-500'}`} />
            </div>
          )}
          <div>
            <p className="font-semibold text-white">
              {uploading ? 'Uploading...' : isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
            </p>
            <p className="text-slate-500 text-sm mt-1">or <span className="text-brand-400">click to browse</span></p>
          </div>
          <p className="text-xs text-slate-600">PDF, DOC, DOCX • Max 5MB</p>
        </div>
      </div>

      {/* Resume list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-surface-border rounded w-1/2 mb-2" />
              <div className="h-3 bg-surface-border rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : resumes.length === 0 ? (
        <div className="card p-10 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No resumes uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-slate-400 text-sm">{resumes.length} resume{resumes.length !== 1 ? 's' : ''}</p>
          <AnimatePresence>
            {resumes.map((resume) => {
              const ps = PARSE_STATUS[resume.parseStatus] || PARSE_STATUS.pending;
              const PsIcon = ps.icon;

              return (
                <motion.div key={resume._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="card p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${resume.isDefault ? 'bg-amber-600/20' : 'bg-brand-600/20'}`}>
                      <FileText className={`w-5 h-5 ${resume.isDefault ? 'text-amber-400' : 'text-brand-400'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-medium text-white text-sm truncate">{resume.originalName}</p>
                        {resume.isDefault && (
                          <span className="badge bg-amber-600/20 text-amber-300 border-amber-500/30">
                            <Star className="w-3 h-3" /> Default
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className={`badge ${ps.cls} flex items-center gap-1`}>
                          <PsIcon className={`w-3 h-3 ${resume.parseStatus === 'pending' ? 'animate-spin' : ''}`} />
                          {ps.label}
                        </span>
                        {resume.fileSize && (
                          <span className="text-slate-500">{(resume.fileSize / 1024).toFixed(0)} KB</span>
                        )}
                        <span className="text-slate-500">
                          {new Date(resume.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a href={resume.fileUrl} target="_blank" rel="noreferrer"
                      className="btn-ghost p-2" title="View resume">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    {!resume.isDefault && (
                      <button onClick={() => handleSetDefault(resume._id)} className="btn-ghost p-2 text-amber-400" title="Set as default">
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(resume._id)} disabled={deleting === resume._id}
                      className="btn-danger p-2 aspect-square">
                      {deleting === resume._id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
