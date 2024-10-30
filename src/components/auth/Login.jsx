import React, { useState, useEffect } from "react";
import { auth, db, googleProvider } from "../../firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import './Auth.css';
import { googleLogo } from "../../photos";
import { doc, getDoc, setDoc } from "firebase/firestore";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user document exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          createdAt: new Date().getTime(),
          isAdmin: false,
          emailVerified: true
        });
      }
      
      navigate("/");
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>; 
  }

  return (
    <div className="auth-container">
      <h2>Giriş Yap</h2>
      {error && <p>{error}</p>}
      <button className="google-signin" onClick={handleGoogleLogin}>
        <img src={googleLogo} alt="Google logo" className="google-logo" />
        <span>Gmail ile Giriş Yap</span>
      </button>
      <form onSubmit={handleLogin}>
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
        <button type="submit" className="Confirm">Giriş Yap</button>
      </form>
      <div className="switch-auth">
        <p>Hesabınız yok mu?<a href="/hesap-oluştur">Hesap Oluştur</a></p>
      </div>
    </div>
  );
};

export default Login;