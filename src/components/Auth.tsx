import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../firebase';
import { Lock, Mail, Tv, Sparkles, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

interface AuthProps {
  onSuccess: () => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      let friendlyMessage = 'Ocorreu um erro ao autenticar. Tente novamente.';
      if (err.code === 'auth/invalid-credential') {
        friendlyMessage = 'E-mail ou senha incorretos.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'A senha deve conter no mínimo 6 caracteres.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'Este e-mail já está em uso.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Formato de e-mail inválido.';
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Falha ao autenticar com o Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-gray-900 flex items-center justify-center p-6 relative overflow-hidden font-inter">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] bg-pink-500/10 pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] bg-blue-500/10 pointer-events-none z-0" />

      <div className="w-full max-w-md bg-[#161033]/80 border border-gray-200 30 rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-xl relative z-10 flex flex-col gap-6">
        {/* Logo and Intro */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
            <Tv className="w-7 h-7 text-gray-900" />
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xl font-black tracking-tight font-geist text-gray-900">FAST<span className="text-blue-600">PLAYER</span></span>
            <Sparkles className="w-4 h-4 text-pink-600 animate-pulse" />
          </div>
          <p className="text-xs font-semibold text-brand-outline mt-1 font-geist uppercase tracking-widest">
            Sinalização Digital Inteligente
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="text-xs font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex bg-[#0d0921]/60 p-1.5 rounded-2xl border border-gray-200 15">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              !isSignUp 
                ? 'bg-blue-600 text-brand-on-primary shadow-sm' 
                : 'text-brand-outline hover:text-gray-900'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              isSignUp 
                ? 'bg-blue-600 text-brand-on-primary shadow-sm' 
                : 'text-brand-outline hover:text-gray-900'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-brand-outline uppercase tracking-wider font-geist">
              Endereço de E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-outline/80" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com"
                className="w-full bg-[#0d0921]/50 border border-gray-200 30 rounded-xl pl-11 pr-4 py-3 text-xs text-gray-900 placeholder:text-brand-outline/40 focus:ring-1 focus:ring-brand-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-brand-outline uppercase tracking-wider font-geist">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-outline/80" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                className="w-full bg-[#0d0921]/50 border border-gray-200 30 rounded-xl pl-11 pr-4 py-3 text-xs text-gray-900 placeholder:text-brand-outline/40 focus:ring-1 focus:ring-brand-primary focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-brand-on-primary font-bold text-xs py-3.5 rounded-xl hover:opacity-95 transition-all shadow-md shadow-brand-primary/10 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Criar Conta' : 'Acessar Painel'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-brand-outline-variant/20"></div>
          <span className="text-[10px] font-bold text-brand-outline/60 uppercase tracking-widest">Ou acesse com</span>
          <div className="flex-1 h-px bg-brand-outline-variant/20"></div>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full bg-brand-surface-lowest border border-brand-outline-variant hover:border-brand-primary text-gray-900 font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {/* Custom SVG Google Icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Entrar com o Google</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
