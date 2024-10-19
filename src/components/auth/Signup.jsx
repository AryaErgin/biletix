import React, { useState } from "react";
import { auth } from "../../firebase";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase"; 
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import './Auth.css';

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
        });
        navigate("/profile"); 
        
    } catch (error) {
        setError(error.message);
    }
};
  return (
    <div>
      <h2>Signup</h2>
      {error && <p>{error}</p>}
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
        <button type="submit">Signup</button>
      </form>
    </div>
  );
};

export default Signup;
