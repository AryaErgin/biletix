// src/components/PendingResourceDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import './PendingResourceDetail.css'; // Use a CSS file based on pendingeventdetail.css with resource-specific classnames
import { placeholder } from '../../photos';

const PendingResourceDetail = () => {
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResource = async () => {
      try {
        const resourceDoc = await getDoc(doc(db, 'resources', resourceId));
        if (resourceDoc.exists()) {
          setResource({ id: resourceDoc.id, ...resourceDoc.data() });
        }
      } catch (error) {
        console.error("Error fetching resource:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResource();
  }, [resourceId]);

  const handleConfirm = async () => {
    try {
      await updateDoc(doc(db, 'resources', resourceId), { status: 'confirmed' });
      alert('Resource confirmed!');
      navigate('/resource-confirm'); // Route for resource confirmation list
    } catch (error) {
      console.error("Error confirming resource:", error);
    }
  };

  const handleDeny = async () => {
    try {
      await deleteDoc(doc(db, 'resources', resourceId));
      alert('Resource denied and deleted.');
      navigate('/resource-confirm'); // Route for resource confirmation list
    } catch (error) {
      console.error("Error denying resource:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!resource) {
    return <div>Resource not found</div>;
  }

  return (
    <div className="pending-resource-detail">
      <h2 className="detail-title">{resource.title}</h2>
      <div className="detail-thumbnail">
              <img src={resource.thumbnailUrl} alt={placeholder} />
      </div>
      <p className="detail-meta">
        <strong>Yazar:</strong> {resource.author}
      </p>
      <p className="detail-meta">
      <strong>Yayın Tarihi:</strong> {resource.publishDate}
      </p>
      <div className="detail-description">
        <p>{resource.description}</p>
      </div>
      <div className="confirm-actions">
        <button className="approve-button" onClick={handleConfirm}>Confirm</button>
        <button className="disapprove-button" onClick={handleDeny}>Deny</button>
      </div>
    </div>
  );
};

export default PendingResourceDetail;
