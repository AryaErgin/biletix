import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '../../../firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';
import './RejectedEvent.css';

const RejectedEventNotification = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        console.log('Fetching rejected event:', eventId);
        const docRef = doc(db, 'events', eventId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          console.log('Event data:', docSnap.data());
          setEvent({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log('No such event document!');
          setError('Event not found');
        }
      } catch (err) {
        console.error('Error fetching event:', err);
        setError(err.message);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const handleDeleteEvent = useCallback(async () => {
    if (!event) return;

    try {
      // 1. Delete all files in the event's storage folder
      const sanitizedEventName = event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const eventStorageRef = ref(storage, `events/${event.id}_${sanitizedEventName}`);
      
      try {
        const fileList = await listAll(eventStorageRef);
        const deletePromises = fileList.items.map(fileRef => deleteObject(fileRef));
        await Promise.all(deletePromises);
        console.log('All files deleted from storage');
      } catch (storageError) {
        console.error('Error deleting files from storage:', storageError);
        // Continue with document deletion even if storage deletion fails
      }

      // 2. Delete the event document from Firestore
      await deleteDoc(doc(db, 'events', event.id));
      console.log('Event document deleted from Firestore');

      // 3. Navigate back to the user's events page
      navigate('/benim-etkinliklerim');
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event: ' + error.message);
    }
  }, [event, navigate]);

  if (error) return <div className="error-message">{error}</div>;
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
        {event.rejectionReason && (
          <div className="rejection-reason">
            <h4>Red Sebebi:</h4>
            <p>{event.rejectionReason}</p>
          </div>
        )}
      </div>
      <div className="action-buttons">
        <button 
          className="action-button delete-button" 
          onClick={handleDeleteEvent}
        >
          Kabul Et ve Etkinliği Sil
        </button>
      </div>
    </div>
  );
};

export default RejectedEventNotification;