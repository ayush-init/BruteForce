import React from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import LoginAnimation from './components/LoginAnimation';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">

      {/* LEFT SIDE - 70% */}
      <div className="hidden lg:flex lg:w-[68%] min-h-screen items-center justify-center ps-14">
        <LoginAnimation />
      </div>

      {/* THEME TOGGLE */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* RIGHT SIDE - 30% */}
      <div className="relative border-border border-s min-h-screen w-full lg:w-[32%] px-6 sm:px-8 flex items-center justify-center">



        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

    </div>
  );
}
