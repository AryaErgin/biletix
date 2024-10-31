import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './RegisteredUsers.css';

const RegisteredUsers = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

    useEffect(() => {
        const checkAuthAndFetchData = async () => {
            try {
                // Wait for auth state to initialize
                await new Promise((resolve) => {
                    const unsubscribe = auth.onAuthStateChanged((user) => {
                        unsubscribe();
                        resolve(user);
                    });
                });

                // Check if user is authenticated
                if (!auth.currentUser) {
                    navigate('/');
                    return;
                }

                // Fetch event data
                const eventDoc = await getDoc(doc(db, 'events', eventId));
                
                if (!eventDoc.exists()) {
                    navigate('/');
                    return;
                }

                const eventData = eventDoc.data();

                // Check if current user is the event owner
                if (eventData.createdBy !== auth.currentUser.uid) {
                    navigate('/');
                    return;
                }

                setEvent(eventData);

                // Fetch registered users' details
                if (eventData.registeredUsers && eventData.registeredUsers.length > 0) {
                    const usersData = await Promise.all(
                        eventData.registeredUsers.map(async (userId) => {
                            const userDoc = await getDoc(doc(db, 'users', userId));
                            return {
                                id: userId,
                                ...userDoc.data()
                            };
                        })
                    );
                    setRegisteredUsers(usersData);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        checkAuthAndFetchData();
    }, [eventId, navigate]);

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="registered-users">
      <h2>{event?.name}'a Kaydolan Kişiler</h2>
      <div className="users-grid">
        {registeredUsers.map((user, index) => (
          <div key={index} className="user-card">
            <h3>{user?.username}</h3>
            <p>Yaş: {user?.age}</p>
            <p>E-Posta: {user?.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegisteredUsers;