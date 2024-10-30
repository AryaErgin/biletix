import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from "../../firebase"
import './Header.css';
import logo from "../../photos/logo.png";
import logo1 from  "../../photos/logo1.png";

const Header = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        checkAdminStatus(user);
      } else {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkAdminStatus = async (user) => {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().isAdmin) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="main-header">
      <div className="nav-container">
        <div className="logo-container">
          <img src={logo} alt="Your Logo" className="your-logo" />
          <img src={logo1} alt="INTEGRA Logo" className="integra-logo" />
        </div>
        <div className={`hamburger ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <nav className={isMenuOpen ? 'open' : ''}>
          <Link to="/" onClick={toggleMenu}>Etkinlikler</Link>
          <a 
            href="https://team3646.com" 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={toggleMenu}
          >
            Hakkımızda
          </a>
          {user ? (
            <>
              <Link to="/etkinlik-oluştur" onClick={toggleMenu}>Etkinlik Oluştur</Link>
              <Link to="/benim-etkinliklerim" onClick={toggleMenu}>Benim Etkinliklerim</Link>
              {isAdmin && !loading && <Link to="/etkinlik-onayla" onClick={toggleMenu}>Etkinlik Onayla</Link>}
              <Link to="/profil" onClick={toggleMenu}>Profil</Link>
            </>
          ) : (
            <>
              <Link to="/giriş-yap" onClick={toggleMenu}>Giriş Yap</Link>
              <Link to="/hesap-oluştur" onClick={toggleMenu}>Hesap Oluştur</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;