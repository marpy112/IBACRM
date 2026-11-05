import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import './Header.css';

export const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-top">
          <img src="/iba-logo.png" alt="IBA College of Mindanao" className="header-logo" />
          <div className="header-text">
            <p className="header-title">IBA College of Mindanao Inc.</p>
            <h1 className="header-subtitle">Research Atlas</h1>
          </div>
        </div>
        <nav className="header-nav" aria-label="Main navigation">
          <span className="header-description"><span className="status-dot" /> Discover research across Mindanao</span>
          <Link to="/admin" className="header-admin">Admin portal <Icon name="arrow" width={16} height={16} /></Link>
        </nav>
      </div>
    </header>
  );
};
