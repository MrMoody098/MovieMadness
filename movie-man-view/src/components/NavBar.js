import React, { useEffect, useState } from 'react';
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

  return (
      <div className={`navbar ${show && !isModalOpen ? 'visible' : 'hidden'}`}>
        <div className="navbar-content">
          <div className="logo">MovieMan</div>
          <input
              type="text"
              className="search-bar"
              placeholder="Search..."
              value={query}
              onChange={handleChange}
          />
          <button onClick={handleSearch}>Search</button>
          <div className="nav-links">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </div>
  );
};

export default NavBar;
