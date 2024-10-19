import React from 'react';
import './EventCard.css';
import { placeholder } from '../../photos/index.js';
import { Link } from 'react-router-dom';

const EventCard = ({ event }) => {
  return (
    <Link to={`/event/${event.id}`} className="event-link">
    <a href={event.link} className="event-card">
      <div className="event-image">
        <img src={event.imageUrl || placeholder} alt={event.name} />
      </div>
      <div className="event-details">
        <h3>{event.name}</h3>
        <p>{event.location}</p>
        <p>{event.date}</p>
        <p>{event.description.length > 100 ? `${event.description.substring(0, 100)}...` : event.description}</p>
      </div>
    </a>
    </Link>
  );
};

export default EventCard;
