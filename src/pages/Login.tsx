import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Diamond, Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const resp = await authApi.login(data.email, data.password);
      if (resp.data.success && resp.data.data) {
        setUser(resp.data.data.user);
        toast.success(`Welcome back, ${resp.data.data.user.name}`);
        navigate('/');
      } else {
        toast.error(resp.data.error || 'Invalid email or password');
      }
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (err as any).response?.data?.error || 'Failed to authenticate. Please check your credentials.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDefaultAdmin = () => {
    setValue('email', 'admin@cinescope.com');
    setValue('password', 'CineScope2026!');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundColor: '#070707',
        backgroundImage: 'radial-gradient(ellipse at 50% 30%, rgba(212,175,55,0.06) 0%, transparent 60%)',
      }}
    >
      {/* Subtle gold grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, #242424 1px, transparent 1px), linear-gradient(to bottom, #242424 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-md relative z-10 fade-in-up">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center rounded-2xl mb-4 pulse-gold"
            style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.05))',
              border: '1px solid rgba(212,175,55,0.4)',
            }}
          >
            <Diamond size={28} style={{ color: '#D4AF37' }} />
          </div>
          <h1
            className="font-cinzel text-2xl font-bold tracking-widest gold-text uppercase"
            style={{ letterSpacing: '0.2em' }}
          >
            CineScope
          </h1>
          <p className="text-xs tracking-widest uppercase mt-1" style={{ color: '#8A8A8A', letterSpacing: '0.3em' }}>
            Control Dashboard V2
          </p>
        </div>

        {/* Login Card */}
        <div
          className="rounded-2xl p-8 glass"
          style={{
            backgroundColor: 'rgba(18, 18, 18, 0.85)',
            border: '1px solid #242424',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          }}
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Administrator Login</h2>
            <p className="text-xs text-muted mt-1">Sign in with your administrator credentials</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: '#8A8A8A' }}
                />
                <input
                  type="email"
                  placeholder="admin@cinescope.com"
                  {...register('email')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none"
                  style={{
                    backgroundColor: '#0D0D0D',
                    border: errors.email ? '1px solid #ef4444' : '1px solid #242424',
                    color: '#FFFFFF',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                  onBlur={(e) => (e.target.style.borderColor = errors.email ? '#ef4444' : '#242424')}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1.5">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: '#8A8A8A' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  {...register('password')}
                  className="w-full pl-10 pr-11 py-2.5 rounded-lg text-sm transition-all focus:outline-none"
                  style={{
                    backgroundColor: '#0D0D0D',
                    border: errors.password ? '1px solid #ef4444' : '1px solid #242424',
                    color: '#FFFFFF',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.6)')}
                  onBlur={(e) => (e.target.style.borderColor = errors.password ? '#ef4444' : '#242424')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1.5">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me & Default Creds */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-muted hover:text-white transition-colors">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="rounded"
                  style={{ accentColor: '#D4AF37' }}
                />
                Remember this session
              </label>
              <button
                type="button"
                onClick={fillDefaultAdmin}
                className="text-xs hover:underline transition-colors"
                style={{ color: '#D4AF37' }}
              >
                Use default login
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #F0D060 50%, #C5A028 100%)',
                color: '#070707',
                boxShadow: '0 4px 20px rgba(212,175,55,0.25)',
                opacity: isLoading ? 0.8 : 1,
              }}
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Control</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Hint */}
          <div
            className="mt-6 p-3 rounded-lg text-xs"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid #242424' }}
          >
            <span className="text-muted block">Default credentials:</span>
            <div className="mt-1 font-mono text-[11px] text-gray-300">
              admin@cinescope.com / CineScope2026!
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-muted">
          <span>Protected CineScope Administration Platform</span>
        </div>
      </div>
    </div>
  );
}

