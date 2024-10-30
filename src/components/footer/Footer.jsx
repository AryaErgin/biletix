import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-columns">
        <div className="footer-column">
          <h4>INTEGRA Etkinlik Sayfası</h4>
          <a 
            href="https://team3646.com" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Hakkımızda
          </a>
          <p>Email: integra3646@gmail.com</p>
        </div>
        <div className="footer-column">
          <h4>Etkinlikler</h4>
          <a href="/etkinlik-oluştur">Etkinlik Oluştur</a>
          <a href="/benim-etkinliklerim">Benim Etkinliklerim</a>
        </div>
        <div className="footer-column">
          <h4>Yeni Etkinliklerden Haberdar Ol</h4>
          <input type="email" placeholder="Your email" />
          <button>Abone Ol</button>
        </div>
      </div>
      <div className='copyright'>
      <p>&copy; Copyright 2024 All Rights Reserved INTEGRA 3646 Tarafından Oluşturuldu</p>
      </div>
    </footer>
  );
};

export default Footer;