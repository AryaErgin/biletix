import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-columns">
        <div className="footer-column">
          <h4>INTEGRA Etkinlik Sayfası</h4>
          <p>Hakkımızda</p>
          <p>İletişime Geçin</p>
        </div>
        <div className="footer-column">
          <h4>Dorem Ipsum</h4>
          <p>Suscipit Sodales</p>
          <p>Nec Placerat</p>
        </div>
        <div className="footer-column">
          <h4>Yeni Etkinliklerden Haberdar Ol</h4>
          <input type="email" placeholder="Your email" />
          <button>Subscribe</button>
        </div>
      </div>
      <div className='copyright'>
      <p>&copy; Copyright 2024 INTEGRA 3646 Tarafından Oluşturuldu</p>
      </div>
    </footer>
  );
};

export default Footer;
