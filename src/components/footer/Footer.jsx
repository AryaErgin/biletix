import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-columns">
        <div className="footer-column">
          <h4>SteamNearMe</h4>
          <p>About Us</p>
          <p>Contact</p>
          <p>Help</p>
        </div>
        <div className="footer-column">
          <h4>Plan Your Event</h4>
          <p>Create Event</p>
          <p>Manage Events</p>
        </div>
        <div className="footer-column">
          <h4>Get the Latest Updates</h4>
          <input type="email" placeholder="Your email" />
          <button>Subscribe</button>
        </div>
      </div>
      <div className='copyright'>
      <p>&copy; Copyright 2024 Created by INTEGRA 3646</p>
      </div>
    </footer>
  );
};

export default Footer;
