import React from 'react';
import { Link } from 'react-router-dom';
import './EventCard.css';
import { placeholder } from '../../../photos/index.js';

const EventCard = ({ event }) => {
  if (event.status === 'pending' || event.status === 'rejected') {
    return null;
  }

  return (
    <Link to={`/etkinlik/${event.id}`} className="event-link">
      <div className="event-image">
        <img 
          src={event.thumbnailUrl || placeholder} 
          alt={event.name}
          loading="lazy"
        />
      </div>
      <div className="event-details">
        <h3>{event.name}</h3>
        <div className="event-location">
          <span>📍</span> {event.location}
        </div>
        <div className="event-date">
          <span>📅</span> {event.date}
        </div>
        <div className="event-organizer">
        <span >
          Organizatör: {event.organizer}
        </span>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;