import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './RegisteredUsers.css';

const RegisteredUsers = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState([]);

  useEffect(() => {
    const fetchEventAndUsers = async () => {
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        setEvent(eventDoc.data());
        const users = [];
        for (const userId of eventDoc.data().registeredUsers || []) {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            users.push(userDoc.data());
          }
        }
        setRegisteredUsers(users);
      }
    };

    fetchEventAndUsers();
  }, [eventId]);

  if (!event) return <div>Loading...</div>;

  return (
    <div className="registered-users">
      <h2>Registered Users for {event.name}</h2>
      <div className="users-grid">
        {registeredUsers.map((user, index) => (
          <div key={index} className="user-card">
            <h3>{user.username}</h3>
            <p>Age: {user.age}</p>
            <p>Email: {user.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegisteredUsers;