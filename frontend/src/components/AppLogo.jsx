import React from 'react';

export default function AppLogo({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <linearGradient id="logoAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
        <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Left Book Spine/Pages */}
      <path
        d="M25 15 C 35 15, 45 20, 50 25 C 55 20, 65 15, 75 15 L 75 80 C 65 80, 55 85, 50 80 C 45 85, 35 80, 25 80 Z"
        fill="#1e1b4b"
        stroke="url(#logoBgGrad)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      
      {/* Right Page (Cover aspect) */}
      <path
        d="M50 25 C 55 20, 65 15, 75 15 L 75 80 C 65 80, 55 85, 50 80 Z"
        fill="url(#logoBgGrad)"
        fillOpacity="0.15"
      />

      {/* Inner Page curves at the top */}
      <path
        d="M25 20 C 35 20, 45 24, 50 29 C 55 24, 65 20, 75 20"
        stroke="url(#logoBgGrad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M25 25 C 35 25, 45 28, 50 33 C 55 28, 65 25, 75 25"
        stroke="url(#logoBgGrad)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Play Button Triangle at the center, layered/floating */}
      <g filter="url(#logoGlow)">
        {/* Floating Play Glassmorphic Card */}
        <path
          d="M38 32 H 68 A 6 6 0 0 1 74 38 V 68 A 6 6 0 0 1 68 74 H 38 A 6 6 0 0 1 32 68 V 38 A 6 6 0 0 1 38 32 Z"
          fill="#0f172a"
          fillOpacity="0.75"
          stroke="url(#logoBgGrad)"
          strokeWidth="3"
        />
        
        {/* Outer Triangle with Coral Accent */}
        <path
          d="M46 42 L 62 50 L 46 58 Z"
          fill="url(#logoBgGrad)"
          stroke="url(#logoAccentGrad)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
