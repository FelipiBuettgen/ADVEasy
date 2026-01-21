import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-2 mb-6">
       {/* Recreating the provided logo using SVG and text */}
       <div className="relative">
          {/* Scale icon */}
          <svg width="40" height="40" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M25 10L10 40H40L25 10Z" stroke="#0d1d36" strokeWidth="2" fill="none"/>
             <path d="M25 10V40" stroke="#0d1d36" strokeWidth="2"/>
             <path d="M10 40C10 45 40 45 40 40" fill="#0d1d36"/>
          </svg>
          {/* Gold Arc */}
          <svg className="absolute -top-1 -left-2" width="50" height="20" viewBox="0 0 50 20" fill="none">
             <path d="M5 15C15 5 35 5 45 15" stroke="#C5A059" strokeWidth="3" fill="none" strokeLinecap="round"/>
          </svg>
       </div>
       <div className="text-3xl font-light tracking-tight text-white">
          <span className="font-normal text-[#0d1d36] dark:text-white">Adv</span>
          <span className="font-light text-[#0d1d36] dark:text-white">Easy</span>
          <sup className="text-xs text-[#C5A059] border border-[#C5A059] rounded-full px-1 py-0.5 ml-1">R</sup>
       </div>
    </div>
  );
};

export default Logo;