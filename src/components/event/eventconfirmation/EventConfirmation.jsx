import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase'; 
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './EventConfirmation.css';

const EventConfirmation = () => {
  const [pendingEvents, setPendingEvents] = useState([]);

  useEffect(() => {
    const fetchPendingEvents = async () => {
      const q = query(collection(db, 'events'), where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      const events = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPendingEvents(events);
    };

    fetchPendingEvents();
  }, []);

  return (
    <div className="event-confirmation">
      <h2>Pending Events</h2>
      <div className="pending-events-grid">
        {pendingEvents.map((event) => (
          <Link
            to={`/etkinlik-onayla/${event.id}`}
            key={event.id}
            className="pending-event-card"
          >
            <div className="event-image">
              <img src={event.thumbnailUrl} alt={event.name} />
            </div>
            <div className="event-details">
              <h3>{event.name}</h3>
              <p>{event.location}</p>
              <p>{event.date}</p>
              <p>
                {event.description.length > 100
                  ? `${event.description.substring(0, 100)}...`
                  : event.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default EventConfirmation;