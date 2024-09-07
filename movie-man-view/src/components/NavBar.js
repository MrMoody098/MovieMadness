// src/components/NavBar.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const NavBar = ({ onSearch, isModalOpen }) => {
  const [show, setShow] = useState(true);
  const [query, setQuery] = useState('');

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
          <div className="nav-links">
            <Link to="/explore">Explore All</Link>
            <Link to="/movies">Movies</Link>
            <Link to="/tv-shows">TV Shows</Link>
            <Link to="/filter">Filter</Link>
          </div>
        </div>
      </div>
  );
};

export default NavBar;
