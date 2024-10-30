import React, { useEffect, useState } from 'react';
import { auth, googleProvider, db } from "../../firebase";
import { doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, sendEmailVerification, deleteUser, signInWithPopup } from "firebase/auth";
import './Auth.css';
import { googleLogo } from "../../photos";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const actionCodeSettings = {
        url: process.env.NODE_ENV === 'development'
          ? 'http://localhost:3000/verify-email'
          : 'https://your-firebase-app.web.app/verify-email',
        handleCodeInApp: true,
      };

      await sendEmailVerification(user, actionCodeSettings);

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: new Date().getTime(),
        isAdmin: false,
        emailVerified: false
      });

      const checkVerification = async () => {
        await user.reload();
        
        if (user.emailVerified) {
          await setDoc(doc(db, "users", user.uid), {
            emailVerified: true
          }, { merge: true });
          setMessage("Email verified successfully!");
          navigate("/profil");
          return;
        }

        const userDoc = await doc(db, "users", user.uid);
        const creationTime = (await getDoc(userDoc)).data()?.createdAt;
        const timeElapsed = new Date().getTime() - creationTime;

        if (timeElapsed > 5 * 60 * 1000 && !user.emailVerified) {
          try {
            await deleteUser(user);
            await deleteDoc(doc(db, "users", user.uid));
            setMessage("Account deleted due to no verification within 15 minutes. Please sign up again.");
            navigate("/hesap-oluştur");
          } catch (error) {
            console.error("Error deleting unverified user:", error);
          }
          return;
        }

        // Update countdown message
        const timeLeft = Math.max(0, (15 * 60 * 1000 - timeElapsed) / 1000);
        const minutes = Math.floor(timeLeft / 60);
        const seconds = Math.floor(timeLeft % 60);
        setMessage(
          `Please verify your email. Time remaining: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}. ` +
          'Unverified accounts will be automatically deleted.'
        );

        if (timeLeft > 0) {
          setTimeout(checkVerification, 1000);
        }
      };

      checkVerification();

    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: new Date().getTime(),
        isAdmin: false,
        emailVerified: true
      });
      
      navigate("/profil");
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="auth-container">
      <h2>Hesap Oluştur</h2>
      {error && <div className="error-message">{error}</div>}
      {message && <div className="info-message">{message}</div>}
      <button className="google-signin" onClick={handleGoogleSignup}>
        <img src={googleLogo} alt="Google logo" className="google-logo" />
        Gmail ile Hesap Oluştur
      </button>
      <form onSubmit={handleSignup}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit" className="Confirm">Hesap Oluştur</button>
      </form>
      <div className="switch-auth">
        <p>Zaten hesabınız var mı?<a href="/giriş-yap">Giriş Yap</a></p>
      </div>
    </div>
  );
};

export default Signup;