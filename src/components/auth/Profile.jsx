import React, { useEffect, useState } from "react";
import { auth } from "../../firebase";

const Profile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div>
      <h2>User Profile</h2>
      {user ? (
        <div>
          <p>Email: {user.email}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <p>No user is logged in.</p>
      )}
    </div>
  );
};

export default Profile;
