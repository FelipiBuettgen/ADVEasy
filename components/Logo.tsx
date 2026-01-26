import React from 'react';

const Logo: React.FC = () => {
   return (
      <div className="logo">
       {/* 
          If you have a PNG, uncomment the line below and change the src.
          <img src="/path/to/adveasy-logo.png" alt="ADVeasy" className="logo-image" />
       */}
       
      <div className="logo-inner">
          {/* Logo Mark - Golden Scale abstract */}
          <div className="logo-mark">
             <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 5L5 35H35L20 5Z" stroke="#C5A059" strokeWidth="2.5" fill="none"/>
                <circle cx="20" cy="22" r="3" fill="#C5A059" />
             </svg>
          </div>

          {/* Typography */}
          <div className="logo-wordmark">
            <div className="logo-title">
                <span className="logo-title-strong">ADV</span>
                <span className="logo-title-light">easy</span>
            </div>
          </div>
          
          <div className="logo-badge">
              <span className="logo-badge-text">DASHBOARD</span>
          </div>
       </div>
    </div>
  );
};

export default Logo;
