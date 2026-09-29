import { Link, useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';

export default function RegisterPage() {
  const googleLoginUrl = `${import.meta.env.VITE_API_URL || '/api'}/auth/google`;

  return (
    <div>
      <h2 className="text-3xl font-display font-bold text-white mb-2">Create account</h2>
      <p className="text-slate-400 mb-8">Start practicing with AI-powered interviews</p>

      <a href={googleLoginUrl} className="btn-primary w-full mt-2">
        <FcGoogle className="w-5 h-5" />
        Continue with Google
      </a>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
