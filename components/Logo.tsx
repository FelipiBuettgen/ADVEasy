import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-3">
       {/* 
          If you have a PNG, uncomment the line below and change the src.
          <img src="/path/to/adveasy-logo.png" alt="ADVeasy" className="h-8" />
       */}
       
       <div className="relative flex items-center">
          {/* Logo Mark - Golden Scale abstract */}
          <div className="w-8 h-8 mr-2 relative">
             <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 5L5 35H35L20 5Z" stroke="#C5A059" strokeWidth="2.5" fill="none"/>
                <circle cx="20" cy="22" r="3" fill="#C5A059" />
             </svg>
          </div>

          {/* Typography */}
          <div className="flex flex-col justify-center leading-none">
            <div className="text-xl tracking-tight text-white flex items-baseline">
                <span className="font-bold">ADV</span>
                <span className="font-light">easy</span>
            </div>
          </div>
          
          <div className="ml-2 px-2 py-0.5 border border-[#333] rounded bg-[#1f1f1f]">
              <span className="text-[10px] text-gray-400 tracking-wider font-semibold">DASHBOARD</span>
          </div>
       </div>
    </div>
  );
};

export default Logo;
