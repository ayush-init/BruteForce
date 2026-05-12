"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import LoginForm from '@/components/admin/login/LoginForm';

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-loginCard p-4 relative overflow-hidden">


      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full  max-w-md relative "
      >
        <LoginForm />
      </motion.div>
    </div>
  );
}