import React from 'react';

interface AtipayCoinProps {
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const AtipayCoin: React.FC<AtipayCoinProps> = ({ 
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    xxs: 'w-3 h-3',
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Coin Background */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg transform rotate-12">
        {/* Shine effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent opacity-30"></div>
      </div>
      
      {/* Logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img 
          src="/assets/atipay_logo-moneda.png" 
          alt="Atipay Coin"
          className="w-3/4 h-3/4 object-contain"
        />
      </div>
      
      {/* Inner border */}
      <div className="absolute inset-0 rounded-full border-2 border-yellow-300/50"></div>
    </div>
  );
};

export default AtipayCoin;
