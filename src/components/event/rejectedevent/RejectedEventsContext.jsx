// RejectedEventsContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const RejectedEventsContext = createContext();

export const useRejectedEvents = () => useContext(RejectedEventsContext);

export const RejectedEventsProvider = ({ children }) => {
  const [rejectedEvents, setRejectedEvents] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        console.log('No user logged in');
        return;
      }

      console.log('Setting up rejected events listener for user:', user.uid);

      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('createdBy', '==', user.uid),
        where('status', '==', 'rejected')
      );

      const listener = onSnapshot(q, (snapshot) => {
        const rejectedEventsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Rejected events updated:', rejectedEventsList);
        setRejectedEvents(rejectedEventsList);
      }, (error) => {
        console.error('Error in rejected events listener:', error);
      });

      return () => listener();
    });

    return () => unsubscribe();
  }, []);

  return (
    <RejectedEventsContext.Provider value={{ rejectedEvents, setRejectedEvents }}>
      {children}
    </RejectedEventsContext.Provider>
  );
};