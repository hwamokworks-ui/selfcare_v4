import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import App from '../App';

const REMEMBER_EMAIL_KEY = 'selfcare_v4_remember_email';
const REMEMBER_PASSWORD_KEY = 'selfcare_v4_remember_password';

function SetupNeededScreen() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="text-sm font-bold text-[#2A2723]">Supabase 설정이 필요합니다</span>
      <p className="text-xs text-[#737373] max-w-xs leading-relaxed">
        프로젝트 루트에 <code className="font-mono">.env.local</code> 파일을 만들고{' '}
        <code className="font-mono">VITE_SUPABASE_URL</code>, <code className="font-mono">VITE_SUPABASE_ANON_KEY</code>
        를 입력한 뒤 개발 서버를 다시 시작해주세요. (<code className="font-mono">.env.example</code> 참고)
      </p>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center gap-3">
      <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-mono font-bold text-[#737373] tracking-widest uppercase">LOADING...</span>
    </div>
  );
}

function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_EMAIL_KEY) ?? '');
  const [password, setPassword] = useState(() => localStorage.getItem(REMEMBER_PASSWORD_KEY) ?? '');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem(REMEMBER_EMAIL_KEY) !== null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'error' | 'signup-check-email'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setStatus('sending');
    setErrorMessage('');
    if (rememberMe) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, email);
      localStorage.setItem(REMEMBER_PASSWORD_KEY, password);
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
      localStorage.removeItem(REMEMBER_PASSWORD_KEY);
    }

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('signInWithPassword failed', error);
        setErrorMessage(error.message);
        setStatus('error');
      }
      // On success, AuthGate's onAuthStateChange picks up the new session automatically.
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        console.error('signUp failed', error);
        setErrorMessage(error.message);
        setStatus('error');
      } else if (data.session) {
        // Email confirmation is off for this project, already logged in.
      } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        // Supabase returns no error and no session for an email that's already registered,
        // to avoid leaking which emails exist.
        setErrorMessage('이미 가입된 이메일입니다. 로그인을 시도해주세요.');
        setStatus('error');
      } else {
        setStatus('signup-check-email');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center gap-6 px-4">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-[#6F8F6A]"></div>
        <span className="font-bold tracking-tight text-lg text-[#2A2723] font-serif">오늘의 건강</span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs bg-[#FBF9F3] border border-[#E4DECF] rounded-2xl p-5 space-y-3"
      >
        <p className="text-xs font-bold text-[#8A8271] uppercase tracking-wide">
          {mode === 'login' ? '이메일로 로그인' : '이메일로 회원가입'}
        </p>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-3 py-2 rounded-lg border border-[#E4DECF] bg-white text-sm text-[#2A2723] outline-none focus:border-[#6F8F6A]"
        />
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 (6자 이상)"
            className="w-full px-3 py-2 pr-9 rounded-lg border border-[#E4DECF] bg-white text-sm text-[#2A2723] outline-none focus:border-[#6F8F6A]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8271] hover:text-[#2A2723]"
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-[#8A8271] font-medium select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-[#E4DECF] text-[#6F8F6A] focus:ring-[#6F8F6A]"
          />
          아이디와 비밀번호 기억하기
        </label>
        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full py-2 rounded-lg bg-[#6F8F6A] text-white text-sm font-bold disabled:opacity-60"
        >
          {status === 'sending' ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>
        {status === 'signup-check-email' && (
          <p className="text-xs text-[#6F8F6A] font-medium">
            가입 확인 메일이 발송되었습니다. 메일함(스팸함 포함)에서 확인 링크를 눌러주세요.
          </p>
        )}
        {status === 'error' && (
          <p className="text-xs text-red-600 font-medium">
            {mode === 'login' ? '로그인' : '회원가입'}에 실패했습니다: {errorMessage || '알 수 없는 오류'}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setStatus('idle');
            setErrorMessage('');
          }}
          className="w-full text-center text-[11px] text-[#8A8271] font-medium hover:text-[#2A2723]"
        >
          {mode === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
        </button>
      </form>
    </div>
  );
}

export default function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setChecking(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    return <SetupNeededScreen />;
  }

  if (checking) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <App
      userId={session.user.id}
      userEmail={session.user.email ?? ''}
      onSignOut={() => supabase.auth.signOut()}
    />
  );
}
