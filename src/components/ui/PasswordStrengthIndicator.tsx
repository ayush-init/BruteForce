import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldX, AlertTriangle, CheckCircle } from 'lucide-react';
import { useProgressivePasswordValidation } from '@/hooks/useProgressivePasswordValidation';

interface PasswordStrengthIndicatorProps {
  password: string;
  showLabel?: boolean;
  className?: string;
}

export function PasswordStrengthIndicator({ 
  password, 
  showLabel = true, 
  className = '' 
}: PasswordStrengthIndicatorProps) {
  // Use the new progressive validation system
  const { currentColorClasses, isComplete, message, currentStep, totalSteps } = useProgressivePasswordValidation(password);

  if (!password) {
    return null;
  }

  // Get strength icon based on current validation state
  const getStrengthIcon = () => {
    if (isComplete) {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
    
    if (currentStep <= 2) {
      return <ShieldX className="w-4 h-4 text-red-400" />;
    }
    
    return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
  };

  // Calculate progress percentage based on current step
  const strengthPercentage = (currentStep / totalSteps) * 100;
  const currentColor = currentColorClasses.progress;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progressive validation message */}
      <AnimatePresence mode="wait">
        <motion.div
          key={message}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className={`text-xs font-medium ${currentColorClasses.text}`}
        >
          {isComplete && (
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-400" />
              <span className="text-green-400">{message}</span>
            </div>
          )}
          {!isComplete && (
            <span>{message}</span>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}



interface PasswordInputWithValidationProps {
  password: string;
  onPasswordChange: (password: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showStrengthIndicator?: boolean;
  showChecklist?: boolean;
  className?: string;
  error?: string;
}

export function PasswordInputWithValidation({
  password,
  onPasswordChange,
  placeholder = "••••••••",
  disabled = false,
  showStrengthIndicator = true,
  showChecklist = true,
  className = '',
  error
}: PasswordInputWithValidationProps) {
  // Use the new progressive validation system
  const { currentColorClasses, isComplete } = useProgressivePasswordValidation(password);
  const [showPassword, setShowPassword] = React.useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const inputBorderClass = password 
    ? isComplete 
      ? 'focus:border-logo' 
      : 'focus:border-logo'
    : 'focus:border-logo/40';

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative group">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          disabled={disabled}
          onCopy={(e) => e.preventDefault()}
          onPaste={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          placeholder={placeholder}
          className={`w-full h-12 pl-11 pr-12 border border-foreground/10 ${inputBorderClass} rounded-xl text-sm text-foreground placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-logo/5 transition-all`}
        />
        
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {showPassword ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
        
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <svg className="w-4 h-4 text-slate-500 group-focus-within:text-logo transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400"
        >
          {error}
        </motion.div>
      )}

      {showStrengthIndicator && (
        <PasswordStrengthIndicator 
          password={password} 
          showLabel={true}
        />
      )}
    </div>
  );
}
