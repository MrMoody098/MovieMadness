// src/components/NavBar.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const NavBar = ({ onSearch, isModalOpen, onJoinRoom }) => {
  const [show, setShow] = useState(true);
  const [query, setQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  let lastScrollY = window.pageYOffset;

  const handleScroll = () => {
    const currentScrollY = window.pageYOffset;

    if (lastScrollY > currentScrollY) {
      setShow(true); // Scrolling up
    } else {
      setShow(false); // Scrolling down
    }
    lastScrollY = currentScrollY;
  };

  const handleChange = (event) => {
    setQuery(event.target.value);
  };

  const handleSearch = () => {
    onSearch(query);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isNavbarVisible = show && !isModalOpen;

  return (
      <div className={`navbar ${isNavbarVisible ? 'visible' : 'hidden'}`}>
        <div className="navbar-content">
          <div className="logo">MovieMan</div>
          <input
              type="text"
              className="search-bar"
              placeholder="Search..."
              value={query}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
          />
          <button className="mobile-menu-button" onClick={toggleMobileMenu}>
            ☰
          </button>
          <div className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
            <Link to="/explore">Explore</Link>
            <Link to="/movies">Movies</Link>
            <Link to="/tv-shows">TV Shows</Link>
            <Link to="/filter">Filter</Link>
            <button 
              className="join-room-button"
              onClick={onJoinRoom}
              style={{
                backgroundColor: '#e74c3c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '5px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                marginLeft: '10px'
              }}
            >
              🎉 Join Room
            </button>
          </div>
        </div>
      </div>
  );
};

export default NavBar;