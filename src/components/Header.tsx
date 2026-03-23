import React from 'react';
import './Header.css';

export const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-top">
          <img src="/iba-logo.png" alt="IBA College of Mindanao" className="header-logo" />
          <div className="header-text">
            <h1 className="header-title">IBA COLLEGE OF MINDANAO INC.</h1>
            <h2 className="header-subtitle">RESEARCH MAP</h2>
          </div>
        </div>
        <p className="header-description">
          Explore research locale off all approved researches
        </p>
      </div>
    </header>
  );
};
