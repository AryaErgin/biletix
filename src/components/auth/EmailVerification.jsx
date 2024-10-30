import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { applyActionCode, onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import './Auth.css';

const EmailVerification = () => {
  const [verificationStatus, setVerificationStatus] = useState('checking');
  const navigate = useNavigate();

  const updateUserVerificationStatus = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        emailVerified: true
      });
      console.log("User verification status updated in Firestore");
    } catch (error) {
      console.error("Error updating user verification status:", error);
    }
  };

  useEffect(() => {
    const verifyEmail = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const oobCode = urlParams.get('oobCode');
      const mode = urlParams.get('mode');

      if (oobCode && mode === 'verifyEmail') {
        try {
          await applyActionCode(auth, oobCode);
          
          const user = auth.currentUser;
          if (user) {
            await updateUserVerificationStatus(user.uid);
          }
          
          setVerificationStatus('verified');
          setTimeout(() => navigate('/profil'), 2000);
        } catch (error) {
          console.error('Verification failed:', error);
          setVerificationStatus('error');
        }
      } else {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            await user.reload();
            if (user.emailVerified) {
              setVerificationStatus('already-verified');
              setTimeout(() => navigate('/profil'), 2000);
            } else {
              setVerificationStatus('not-verified');
            }
          } else {
            setVerificationStatus('no-user');
            setTimeout(() => navigate('/giriş-yap'), 2000);
          }
        });

        return () => unsubscribe();
      }
    };

    verifyEmail();
  }, [navigate]);

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case 'checking':
        return 'E-posta doğrulaması kontrol ediliyor...';
      case 'verified':
        return 'E-posta başarıyla doğrulandı! Profilinize yönlendiriliyorsunuz...';
      case 'already-verified':
        return 'E-postanız zaten doğrulanmış. Profilinize yönlendiriliyorsunuz...';
      case 'not-verified':
        return 'E-postanız henüz doğrulanmamış. Lütfen e-postanızı kontrol edin ve doğrulama bağlantısına tıklayın.';
      case 'no-user':
        return 'Oturum açmanız gerekiyor. Giriş sayfasına yönlendiriliyorsunuz...';
      case 'error':
        return 'Doğrulama sırasında bir hata oluştu. Lütfen tekrar deneyin.';
      default:
        return '';
    }
  };

  return (
    <div className="auth-container">
      <h2>E-posta Doğrulama</h2>
      <p className={`verification-message ${verificationStatus}`}>
        {getStatusMessage()}
      </p>
    </div>
  );
};

export default EmailVerification;