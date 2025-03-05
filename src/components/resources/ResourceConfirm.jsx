// src/components/ResourceConfirm.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Link } from 'react-router-dom';
import './ResourceConfirm.css';

const ResourceConfirm = () => {
  const [pendingResources, setPendingResources] = useState([]);

  useEffect(() => {
    const fetchPendingResources = async () => {
      try {
        const resourcesCollection = collection(db, 'resources');
        const snapshot = await getDocs(resourcesCollection);
        const pendingList = snapshot.docs
          .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
          .filter(resource => resource.status === 'pending');
        setPendingResources(pendingList);
      } catch (error) {
        console.error("Error fetching pending resources:", error);
      }
    };

    fetchPendingResources();
  }, []);

  return (
    <div className="resource-confirmation">
      <h2>Pending Resource Confirmations</h2>
      <div className="pending-resources-grid">
        {pendingResources.map(resource => (
          <Link key={resource.id} to={`/resource-onayla/${resource.id}`} className="pending-resource-card">
            <div className="resource-image">
              <img 
                src={resource.thumbnailUrl} 
                alt={resource.title} 
                loading="lazy" 
              />
            </div>
            <div className="resource-details">
              <h3>{resource.title}</h3>
              <p>By {resource.author} on {resource.publishDate}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ResourceConfirm;
