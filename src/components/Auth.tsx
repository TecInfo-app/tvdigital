import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Lock, Mail, Tv, Sparkles, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

interface AuthProps {
  onSuccess: () => void;
}

// Remove unused state and imports
export default function Auth({ onSuccess }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
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
                <span>Acessar Painel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
