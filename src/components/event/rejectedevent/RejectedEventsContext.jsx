import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const RejectedEventsContext = createContext();

export const useRejectedEvents = () => useContext(RejectedEventsContext);

export const RejectedEventsProvider = ({ children }) => {
  const [rejectedEvents, setRejectedEvents] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('createdBy', '==', user.uid),
      where('status', '==', 'rejected')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rejectedEventsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRejectedEvents(rejectedEventsList);
      console.log('Rejected events updated:', rejectedEventsList); // Debug log
    });

    return () => unsubscribe();
  }, []);

  return (
    <RejectedEventsContext.Provider value={{ rejectedEvents, setRejectedEvents }}>
      {children}
    </RejectedEventsContext.Provider>
  );
};