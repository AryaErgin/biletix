import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import './EventCard.css'; // reuse your event card CSS

const ResourcesSection = () => {
  const [resources, setResources] = useState([]);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const resourcesCollection = collection(db, 'resources');
        const snapshot = await getDocs(resourcesCollection);
        const resourcesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setResources(resourcesList);
      } catch (error) {
        console.error('Error fetching resources:', error);
      }
    };
    fetchResources();
  }, []);

  return (
    <div className="resources-section">
      <h2 className="section-title">Published Resources</h2>
      <div className="event-grid">
        {resources.map(resource => (
          <Link key={resource.id} to={`/resource/${resource.id}`} className="event-link">
            <div className="event-image">
              <img 
                src={resource.thumbnailUrl} 
                alt={resource.title} 
                loading="lazy" 
              />
            </div>
            <div className="event-details">
              <h3>{resource.title}</h3>
              <div className="event-location">
                <span role="img" aria-label="author">👤</span> {resource.author}
              </div>
              <div className="event-date">
                <span role="img" aria-label="date">📅</span> {resource.publishDate}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ResourcesSection;
