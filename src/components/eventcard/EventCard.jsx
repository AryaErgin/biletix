import React from 'react';
import './EventCard.css';
import { placeholder } from '../../photos/index.js';

const EventCard = ({ event }) => {
  return (
    <a href={event.link} className="event-card">
      <div className="event-image">
        <img src={event.imageUrl || placeholder} alt={event.name} />
      </div>
      <div className="event-details">
        <h3>{event.name}</h3>
        <p>{event.location}</p>
        <p>{event.date}</p>
        <p>{event.description}</p>
      </div>
    </a>
  );
};

export default EventCard;
