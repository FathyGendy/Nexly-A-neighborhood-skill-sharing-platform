import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "h-8 w-auto", showText = true }) => {
  return (
    <div className="flex items-center gap-2">
      {/* The Icon */}
      <svg
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M25 46C25 46 42 33.5 42 19.5C42 10.111 34.389 2.5 25 2.5C15.611 2.5 8 10.111 8 19.5C8 33.5 25 46 25 46Z"
          className="fill-blue-600"
        />
        <path
          d="M17 24L22 16L28 24L33 16"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      
      {/* The Text Name */}
      {showText && (
        <span className="text-2xl font-bold text-blue-600 tracking-tight">
          Nexly
        </span>
      )}
    </div>
  );
};

export default Logo;