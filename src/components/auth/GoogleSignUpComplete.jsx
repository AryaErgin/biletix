import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './Auth.css';

const GoogleSignupComplete = () => {
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.username && userData.age) {
              navigate('/');
              return;
            }
          }
          setLoading(false);
        } catch (error) {
          console.error("Error checking user info:", error);
          setError("Error loading user information");
          setLoading(false);
        }
      } else {
        navigate('/giriş-yap');
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !age.trim()) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        username: username,
        age: parseInt(age),
        createdAt: new Date().getTime(),
        isAdmin: false,
        emailVerified: true
      }, { merge: true });
      
      navigate('/');
    } catch (error) {
      setError('Profil güncellenirken hata oluştu: ' + error.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="loading-spinner">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <h2>Profilinizi Tamamlayın</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Kullanıcı Adı"
          required
        />
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="Yaş"
          required
          min="13"
          max="120"
        />
        <button type="submit" className="Confirm" disabled={loading}>
          {loading ? 'Kaydediliyor...' : 'Kaydınızı Tamamlayın'}
        </button>
      </form>
    </div>
  );
};

export default GoogleSignupComplete;