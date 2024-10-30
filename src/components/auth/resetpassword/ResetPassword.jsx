import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../../../firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import '../Auth.css';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isValidCode, setIsValidCode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = 'Şifre Sıfırlama | INTEGRA';
    const queryParams = new URLSearchParams(location.search);
    const oobCode = queryParams.get('oobCode');

    if (oobCode) {
      verifyPasswordResetCode(auth, oobCode)
        .then(() => setIsValidCode(true))
        .catch((error) => {
          setError('Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı.');
          console.error('Error verifying reset code:', error);
          setTimeout(() => navigate('/'), 3000);
        });
    } else {
      setError('Şifre sıfırlama kodu bulunamadı.');
      setTimeout(() => navigate('/'), 3000);
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    const queryParams = new URLSearchParams(location.search);
    const oobCode = queryParams.get('oobCode');

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setMessage('Şifreniz başarıyla değiştirildi.');
      setTimeout(() => navigate('/giriş-yap'), 3000);
    } catch (error) {
      setError('Şifre değiştirme sırasında bir hata oluştu: ' + error.message);
    }
  };

  if (!isValidCode) {
    return (
      <div className="auth-container reset-password-container">
        <h2>Şifre Sıfırlama</h2>
        {error && <div className="error-message">{error}</div>}
      </div>
    );
  }

  return (
    <div className="auth-container reset-password-container">
      <h2>Yeni Şifrenizi Giriniz</h2>
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Yeni Şifre"
          required
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Yeni Şifre (Tekrar)"
          required
        />
        <button type="submit" className="reset-password-btn">Şifreyi Değiştir</button>
      </form>
    </div>
  );
};

export default ResetPassword;