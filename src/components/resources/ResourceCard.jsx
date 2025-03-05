// ResourceCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './ResourceCard.css';
import { placeholder } from '../../photos/index.js';

const ResourceCard = ({ resource }) => {
  // Here, you might filter out resources that are not published, similar to events.
  if (resource.status === 'pending' || resource.status === 'rejected') {
    return null;
  }

  return (
    <Link to={`/resource/${resource.id}`} className="resource-link">
      <div className="resource-card">
        <div className="resource-image">
          <img 
            src={resource.thumbnailUrl || placeholder} 
            alt={resource.title}
            loading="lazy"
          />
        </div>
        <div className="resource-details">
          <h3>{resource.title}</h3>
          <div className="resource-date">
            <span role="img" aria-label="date">📅</span> {resource.publishDate}
          </div>
          <div className="resource-author">
            <span role="img" aria-label="author">👤</span> {resource.author}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ResourceCard;
