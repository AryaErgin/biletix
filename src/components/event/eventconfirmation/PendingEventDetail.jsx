import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { GoogleMap } from '@react-google-maps/api';
import './PendingEventDetail.css';

const PendingEventDetail = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (eventDoc.exists()) {
          setEvent({ id: eventDoc.id, ...eventDoc.data() });
        } else {
          console.log('No such event!');
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      }
    };

    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const updateMarker = () => {
      if (!mapRef.current || !window.google || !event?.coordinates) {
        return;
      }

      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      try {
        markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
          position: { 
            lat: event.coordinates.lat, 
            lng: event.coordinates.lng 
          },
          map: mapRef.current
        });
      } catch (error) {
        console.error('Error creating marker:', error);
      }
    };

    if (mapRef.current && event?.coordinates) {
      updateMarker();
    }
  }, [event?.coordinates]);

  const handleNext = () => {
    setCurrentMediaIndex((prevIndex) => (prevIndex + 1) % event.mediaUrls.length);
  };

  const handlePrev = () => {
    setCurrentMediaIndex((prevIndex) => (prevIndex - 1 + event.mediaUrls.length) % event.mediaUrls.length);
  };

  const handleApprove = async () => {
    try {
      await updateDoc(doc(db, 'events', eventId), {
        status: 'approved',
      });
      setMessage('Event approved successfully!');
      setTimeout(() => {
        navigate('/etkinlik-onayla');
      }, 2000);
    } catch (error) {
      setMessage('Error approving event: ' + error.message);
    }
  };

  const handleDisapprove = () => {
    setShowRejectionModal(true);
  };

  const submitRejection = async () => {
    if (!rejectionReason.trim()) {
      setMessage('Please provide a reason for rejection.');
      return;
    }
    try {
      await updateDoc(doc(db, 'events', eventId), {
        status: 'rejected',
        rejectionReason: rejectionReason()
      });
      setMessage('Event disapproved.');
      setShowRejectionModal(false);
      setTimeout(() => {
        navigate('/etkinlik-onayla');
      }, 2000);
    } catch (error) {
      setMessage('Error disapproving event: ' + error.message);
    }
  };

  if (!event) return <div>Yükleniyor...</div>;

  return (
    <div className="pending-event-detail">
      {message && <div className="message">{message}</div>}
      <div className="media-preview">
        <button className="nav-button" onClick={handlePrev}>
          ◀
        </button>
        {event.mediaUrls.length > 0 && (
          <div className="media-container">
            {event.mediaUrls[currentMediaIndex].includes('.mp4?alt=media&token=') ? (
              <video className="media-items" controls>
                <source src={event.mediaUrls[currentMediaIndex]} />
              </video>
            ) : (
              <img
                src={event.mediaUrls[currentMediaIndex]}
                alt={event.name}
                className="media-items"
              />
            )}
          </div>
        )}
        <button className="nav-button" onClick={handleNext}>
          ▶
        </button>
      </div>

      <div className="pending-map-container">
        <GoogleMap
          onLoad={(map) => {
            mapRef.current = map;
            if (event?.coordinates) {
              try {
                markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
                  position: { 
                    lat: event.coordinates.lat, 
                    lng: event.coordinates.lng 
                  },
                  map: map
                });
              } catch (error) {
                console.error('Error creating marker:', error);
              }
            }
          }}
          mapContainerClassName="pending-map"
          center={event.coordinates}
          zoom={15}
          options={{
            mapId: "6100ebed9733d3ab",
          }}
        />
      </div>

      <h2>{event.name}</h2>
      <div className="submitter-info">
      <p><strong>Gönderen:</strong> {event.userEmail || 'Email not available'}</p>
      </div>
      <p><strong>Organizatör:</strong> {event.organizer}</p>
      <p>
        <strong>Konum:</strong> {event.location}
      </p>
      <p>
        <strong>Tarih:</strong> {event.date}
      </p>
      <p><strong>Konteyjan Sınırı: {event.maxCapacity || 'Sınırsız'}</strong></p>
      <p><strong>Yaş Aralığı: {!event.ageRange ? 'Her Yaşa Uygundur' : event.ageRange === 'all' ? 'All Ages' : event.ageRange}</strong></p>
      
      <p><strong>İletişim Bilgileri:</strong></p>
            <div>
                {event.contactInfo.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                ))}
            </div>
      
      <p>
        <strong>Etkinlik Bilgileri:</strong>
      </p>
      <div>
        {event.description.split('\n').map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>

      <div className="confirmation-buttons">
        <button className="approve-button" onClick={handleApprove}>
          Onaylayın
        </button>
        <button className="disapprove-button" onClick={handleDisapprove}>
          Reddedin
        </button>
      </div>

      {showRejectionModal && (
        <div className="rejection-modal">
          <h3>Reddetme Sebebi Belirtiniz</h3>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter reason for rejection"
          />
          <div className="modal-buttons">
            <button onClick={submitRejection}>Gönder</button>
            <button onClick={() => setShowRejectionModal(false)}>İptal Et</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingEventDetail;