import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-xl' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a]/70 flex items-center justify-center p-4 animate-brutal-in">
      <div className={`bg-[#f4f1ea] border-3 border-black rounded-none shadow-[8px_8px_0px_#000] w-full ${maxWidth} overflow-hidden max-h-[90vh] flex flex-col`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-yellow-300 shrink-0">
            <h3 className="font-display text-lg text-black tracking-wider uppercase">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-black font-bold p-1 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function Card({ children, className = '', title, action }) {
  return (
    <div className={`bg-white border-2 border-black rounded-none p-6 shadow-[6px_6px_0px_#000] animate-brutal-in transition-all ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-black">
          <h4 className="font-display text-base text-black tracking-wide uppercase">
            {title}
          </h4>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatusDot({ status }) {
  let bg = 'bg-slate-300 text-black';
  if (status === 'Weak') bg = 'bg-[#ff2d2d] text-white';
  else if (status === 'Developing' || status === 'Okay') bg = 'bg-amber-300 text-black';
  else if (status === 'Strong') bg = 'bg-emerald-400 text-black';

  return (
    <span className={`w-3.5 h-3.5 inline-block shrink-0 border border-black rounded-none ${bg}`} />
  );
}

export function Badge({ variant = 'default', children, className = '' }) {
  const styles = {
    default: 'bg-white text-black border-black',
    primary: 'bg-[#ff2d2d] text-white border-black',
    success: 'bg-emerald-300 text-black border-black',
    warning: 'bg-amber-300 text-black border-black',
    danger: 'bg-[#ff2d2d] text-white border-black'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-xs font-mono font-bold uppercase border-2 ${styles[variant] || styles.default} ${className}`}>
      {children}
    </span>
  );
}

export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse-fast bg-slate-300 border border-black rounded-none ${className}`} />
  );
}

/**
 * Animated Count-Up component (e.g. from 0 to 85%)
 */
export function CountUp({ end = 0, duration = 350, suffix = '', prefix = '' }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const target = Number(end) || 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const reqId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(reqId);
  }, [end, duration]);

  return <span>{prefix}{val}{suffix}</span>;
}

/**
 * Animated Progress Bar that fills smoothly from 0% on load
 */
export function ProgressBar({ value = 0, max = 100, className = '', barColor = 'bg-[#ff2d2d]' }) {
  const [width, setWidth] = useState(0);
  const pct = Math.max(0, Math.min(100, Math.round(((Number(value) || 0) / (Number(max) || 100)) * 100)));

  useEffect(() => {
    const t = setTimeout(() => {
      setWidth(pct);
    }, 50);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className={`w-full h-3 border-2 border-black bg-white overflow-hidden p-0.5 ${className}`}>
      <div 
        className={`h-full ${barColor} transition-all duration-300 ease-out`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

/**
 * Brutalist Loader for AI Operations
 */
export function BrutalistLoader({ message = 'PROCESSING WITH AI...' }) {
  return (
    <div className="p-6 border-3 border-black bg-yellow-300 shadow-[6px_6px_0px_#000] text-center space-y-3 animate-brutal-in">
      <div className="flex items-center justify-center gap-2 font-display text-sm text-black">
        <Loader2 className="w-5 h-5 animate-spin text-[#ff2d2d]" />
        <span>{message}</span>
      </div>
      <div className="w-48 mx-auto h-2 border-2 border-black bg-white overflow-hidden">
        <div className="h-full bg-[#ff2d2d] animate-pulse-fast w-full" />
      </div>
    </div>
  );
}
