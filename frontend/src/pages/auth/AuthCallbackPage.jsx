import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const completeLogin = useAuthStore((state) => state.completeLogin);

  useEffect(() => {
    const completeGoogleLogin = async () => {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = params.get('accessToken');
      const refreshToken = params.get('refreshToken');

      if (!accessToken || !refreshToken) {
        toast.error('Google sign-in was not completed.');
        navigate('/register', { replace: true });
        return;
      }

      try {
        const { data } = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        completeLogin({ user: data.user, accessToken, refreshToken });
        navigate('/dashboard', { replace: true });
      } catch {
        toast.error('Unable to complete Google sign-in.');
        navigate('/register', { replace: true });
      }
    };

    completeGoogleLogin();
  }, [completeLogin, navigate]);

  return null;
}