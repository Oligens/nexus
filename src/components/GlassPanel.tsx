import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gold';
  title?: string;
  icon?: string;
}

const GlassPanel: React.FC<GlassPanelProps> = ({ 
  children, 
  className = '', 
  variant = 'default',
  title,
  icon
}) => {
  const baseClass = variant === 'gold' ? 'glass-panel-gold' : 'glass-panel';
  
  return (
    <div className={`${baseClass} ${className}`}>
      {title && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[rgba(212,175,55,0.2)]">
          {icon && <span className="text-[#00F0FF] text-xs">{icon}</span>}
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] font-[Orbitron]">
            {title}
          </h3>
          <div className="ml-auto flex gap-1">
            <div className="w-2 h-2 rounded-full bg-[#00F0FF] animate-blink"></div>
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] opacity-50"></div>
            <div className="w-2 h-2 rounded-full bg-red-500 opacity-30"></div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export default GlassPanel;
