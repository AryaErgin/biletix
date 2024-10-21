import React, { useState } from "react";
import { auth, googleProvider } from "../../firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import './Auth.css';
import { googleLogo } from "../../photos";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); 

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
      await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Giriş Yap</h2>
      {error && <p>{error}</p>}
      <button className="google-signin" onClick={handleGoogleLogin}>
        <img src={googleLogo} alt="Google logo" className="google-logo" />
        Gmail ile Giriş Yap
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
        <p>Hesabınız yok mu?<a href="/signup">Hesap Oluştur</a></p>
      </div>
    </div>
  );
};

export default Login;
