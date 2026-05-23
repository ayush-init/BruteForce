"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Loader2, LogIn } from 'lucide-react';
import { loginSuperAdmin } from '@/services/auth.service';
import { handleError } from '@/errors';
import Logo from '@/components/Logo';

export function SuperAdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      const data = await loginSuperAdmin({ email, password });
      const { accessToken } = data;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', accessToken);
      }
      
      router.push('/superadmin');
    } catch (err: unknown) {
      handleError(err, { context: 'Login' });
    } finally {
      setLoading(false);
    } 
  };

  return (
    <div className="bg-loginCard border border-border rounded-[32px] p-10 shadow-2xl relative overflow-hidden">
      {/* GLASS REFLECTION */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

      {/* HEADER */}
      <div className="mb-10 text-center relative z-10">
         <motion.div
           initial={{ scale: 0.9 }}
           animate={{ scale: 1 }}
           className="flex justify-center [&_svg]:!w-[180px] [&_svg]:!h-[70px]"
         >
           <Logo />
         </motion.div>
         <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em] mt-3">Super Admin Portal</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        {/* EMAIL FIELD */}
        <div className="space-y-2 ">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 group-focus-within:text-logo transition-colors">
           Email Id
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-logo transition-colors" />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full h-12 pl-11  pr-4 border border-border rounded-xl text-sm text-logo placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-logo/5 focus:border-logo/40 transition-all"
              placeholder="superadmin@pwioi.live"
              required
            />
          </div>
        </div>
        
          <div className="space-y-2 ">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 group-focus-within:text-logo transition-colors">
           Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-logo transition-colors" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              onCopy={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
               placeholder="••••••••"
              required
               className="w-full h-12 pl-11 pr-4  border border-border rounded-xl text-sm text-foreground placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-logo/40 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={20}  /> : <Eye size={20} />}
            </button>
          </div>
          </div> 

        {/* SUBMIT BUTTON */}
        <motion.button 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit" 
          disabled={loading}
          className="w-full h-14 mt-4 !bg-primary text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_0_20px_rgba(204,255,0,0.1)] hover:shadow-[0_0_30px_rgba(204,255,0,0.25)] hover:bg-[#d9ff33] disabled:opacity-50 group relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Authorizing...
              </>
            ) : (
              <>
               <LogIn size={16}  />
                Log In
              </>
            )}
          </span>
          {/* BUTTON SHINE */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
        </motion.button>
      </form>

    </div>
  );
}
