import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  loading = false,
  size = 'md',
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const sizeStyles = {
    sm: 'px-3 py-2 text-xs md:text-sm rounded',
    md: 'px-6 py-3 rounded-lg text-sm md:text-base',
    lg: 'px-8 py-4 rounded-lg text-base md:text-lg',
  };

  const baseStyles = `${sizeStyles[size]} font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`;

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary/50',
    secondary: 'bg-primary-light text-white hover:bg-primary focus:ring-primary-light/50',
    outline: 'border border-primary text-primary bg-transparent hover:bg-primary/5 focus:ring-primary/50',
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
