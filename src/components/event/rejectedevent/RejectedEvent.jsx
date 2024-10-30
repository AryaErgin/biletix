import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import './RejectedEvent.css';

const RejectedEventNotification = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      const docRef = doc(db, 'events', eventId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setEvent(docSnap.data());
      } else {
        console.log('No such document!');
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleDeleteEvent = async () => {
    try {
      await deleteDoc(doc(db, 'events', eventId));
      navigate('/benim-etkinliklerim');
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  if (!event) return <div>Yükleniyor...</div>;

  return (
    <div className="rejected-event-container">
      <div className="rejected-event-header">
        <h2>Etkinlik Reddedildi</h2>
        <p>Onay İsteği Gönderdiğiniz Etkinlik Reddedilmiştir.</p>
      </div>
      <div className="rejected-event-details">
        <h3>{event.name}</h3>
        <div className="rejected-event-info">
          <label>Etkinlik Adı:</label>
          <p>{event.name}</p>
        </div>
        {event.reason && (
          <div className="rejection-reason">
            <h4>Red Sebebi:</h4>
            <p>{event.reason}</p>
          </div>
        )}
      </div>
      <div className="action-buttons">
        <button className="action-button delete-button" onClick={handleDeleteEvent}>
          Kabul Et ve Etkinliği Sil
        </button>
      </div>
    </div>
  );
};

export default RejectedEventNotification;