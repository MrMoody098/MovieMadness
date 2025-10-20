// src/components/NavBar.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const NavBar = ({ onSearch, isModalOpen }) => {
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
    const value = event.target.value;
    setQuery(value);
    // If search is cleared, trigger search with empty string
    if (value === '') {
      onSearch('');
    }
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
          </div>
        </div>
      </div>
  );
};

export default NavBar;