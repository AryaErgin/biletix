import React, { useState } from "react";
import { auth, googleProvider } from "../../firebase";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase"; 
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import './Auth.css';
import { googleLogo } from "../../photos";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); 

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            createdAt: new Date(),
            isAdmin: false,
        });
        navigate("/profile"); 
        
    } catch (error) {
        setError(error.message);
    }
};

const handleGoogleSignup = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    navigate("/profile"); 

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      createdAt: new Date(),
      isAdmin: false,
    });
    navigate("/profile");
  } catch (error) {
    setError(error.message);
  }
};

  return (
    <div className="auth-container">
      <h2>Hesap Oluştur</h2>
      {error && <p>{error}</p>}
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
          <p>Zaten hesabınız var mı?<a href="/login">Giriş Yap</a></p>
      </div>
    </div>
  );
};

export default Signup;
