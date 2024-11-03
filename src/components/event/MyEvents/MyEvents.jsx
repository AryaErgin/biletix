import React, { useEffect, useState, useRef } from 'react';
import { auth, db, storage } from '../../../firebase';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, getDoc, arrayRemove } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { GoogleMap, Autocomplete } from '@react-google-maps/api';
import './MyEvents.css';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';

const MediaItem = ({ file, index, moveMedia, removeMedia }) => {
    const [, ref] = useDrag({
      type: 'media',
      item: { index },
    });
  
    const [, drop] = useDrop({
      accept: 'media',
      hover: (draggedItem) => {
        if (draggedItem.index !== index) {
          moveMedia(draggedItem.index, index);
          draggedItem.index = index;
        }
      },
    });
  
    return (
      <div ref={(node) => ref(drop(node))} className="media-items">
        {typeof file === 'string' ? (
          file.includes('mp4') ? (
            <video src={file} className="preview-media" controls />
          ) : (
            <img src={file} alt="preview" className="preview-media" />
          )
        ) : (
          <img 
            src={URL.createObjectURL(file)} 
            alt="preview" 
            className="preview-media" 
          />
        )}
        <button 
          type="button" 
          className="remove-media-button" 
          onClick={() => removeMedia(index)}
        >
          ×
        </button>
      </div>
    );
  };

const MyEvents = () => {
    const [events, setEvents] = useState([]);
    const [registeredEvents, setRegisteredEvents] = useState([]);
    const [editingEvent, setEditingEvent] = useState(null);
    const [autocomplete, setAutocomplete] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [editingMedia, setEditingMedia] = useState([]);

    useEffect(() => {
        const fetchEvents = async () => {
          const user = auth.currentUser;
          if (user) {
            await loadEvents(user.uid);
          } else {
            const unsubscribe = auth.onAuthStateChanged(async (newUser) => {
              if (newUser) {
                await loadEvents(newUser.uid);
                unsubscribe();
              }
            });
          }
        };
      
        fetchEvents();
      }, []);

    const loadEvents = async (uid) => {
        const q = query(collection(db, 'events'), where('createdBy', '==', uid));
        const querySnapshot = await getDocs(q);
        setEvents(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const registeredEventIds = userSnap.data().registeredEvents || [];
            const registeredEventsData = await Promise.all(
                registeredEventIds.map(async (eventId) => {
                    const eventDoc = await getDoc(doc(db, 'events', eventId));
                    return { id: eventDoc.id, ...eventDoc.data() };
                })
            );
            setRegisteredEvents(registeredEventsData);
        }
        setLoading(false);
    };
    
    useEffect(() => {
        return () => {
            if (markerRef.current) {
                markerRef.current.setMap(null);
            }
            mapRef.current = null;
        };
    }, []);

    const handleDelete = (eventId) => {
        setDeleteConfirmation(eventId);
    };

    const confirmDelete = async () => {
        try {
            // Get the event data before deletion
            const eventDoc = await getDoc(doc(db, 'events', deleteConfirmation));
            if (!eventDoc.exists()) {
                throw new Error('Event not found');
            }
            const eventData = eventDoc.data();
    
            // Remove event from all registered users' registeredEvents array
            if (eventData.registeredUsers && eventData.registeredUsers.length > 0) {
                await Promise.all(eventData.registeredUsers.map(async (userId) => {
                    const userRef = doc(db, 'users', userId);
                    await updateDoc(userRef, {
                        registeredEvents: arrayRemove(deleteConfirmation)
                    });
                }));
            }
    
            // Delete all media files from storage
            if (eventData.mediaUrls && eventData.mediaUrls.length > 0) {
                await Promise.all(eventData.mediaUrls.map(async (url) => {
                    try {
                        const fileRef = ref(storage, url);
                        await deleteObject(fileRef);
                    } catch (error) {
                        console.error('Error deleting file:', error);
                        // Continue with deletion even if a file fails to delete
                    }
                }));
            }
    
            // Delete thumbnail if it's different from mediaUrls
            if (eventData.thumbnailUrl && !eventData.mediaUrls.includes(eventData.thumbnailUrl)) {
                try {
                    const thumbnailRef = ref(storage, eventData.thumbnailUrl);
                    await deleteObject(thumbnailRef);
                } catch (error) {
                    console.error('Error deleting thumbnail:', error);
                    // Continue with deletion even if thumbnail fails to delete
                }
            }
    
            // Finally delete the event document
            await deleteDoc(doc(db, 'events', deleteConfirmation));
            
            setEvents(events.filter(event => event.id !== deleteConfirmation));
            setDeleteConfirmation(null);
    
        } catch (error) {
            console.error('Error during event deletion:', error);
            alert('An error occurred while deleting the event. Please try again.');
        }
    };

    const handleEdit = (event) => {
        setEditingEvent(event);
        setEditingMedia(event.mediaUrls || []);
    };

    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files);
        setEditingMedia((prevMedia) => [...prevMedia, ...files]);
      };

    const handleRemoveMedia = (index) => {
        setEditingMedia((prevMedia) => prevMedia.filter((_, i) => i !== index));
    };

    const handleReorderMedia = (fromIndex, toIndex) => {
        setEditingMedia((prevMedia) => {
          const updatedMedia = [...prevMedia];
          const [movedItem] = updatedMedia.splice(fromIndex, 1);
          updatedMedia.splice(toIndex, 0, movedItem);
          return updatedMedia;
        });
      };

      const handleUpdate = async (e) => {
        e.preventDefault();
        try {
          const updatedEvent = { ...editingEvent };
          const eventId = editingEvent.id;
          const sanitizedEventName = updatedEvent.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const eventDirectory = `events/${eventId}_${sanitizedEventName}`;
      
          // Handle media files
          const mediaUrls = [];
          for (let file of editingMedia) {
            if (file instanceof File) {
              // New file upload
              const uniqueFileName = `${uuidv4()}_${file.name}`;
              const fileRef = ref(storage, `${eventDirectory}/${uniqueFileName}`);
              await uploadBytes(fileRef, file);
              const url = await getDownloadURL(fileRef);
              mediaUrls.push(url);
            } else if (typeof file === 'string') {
              // Check if the file is already in the correct directory
              if (file.includes(eventDirectory)) {
                mediaUrls.push(file);
              } else {
                try {
                  // Extract the original path from the URL
                  const urlParts = file.split('/o/')[1].split('?')[0];
                  const decodedPath = decodeURIComponent(urlParts);
                  
                  // Create references for the source and destination
                  const originalFileRef = ref(storage, decodedPath);
                  const fileName = decodedPath.split('/').pop();
                  const newFileRef = ref(storage, `${eventDirectory}/${fileName}`);
      
                  // Get the file data from the original location
                  const originalFileBlob = await originalFileRef.getDownloadURL()
                    .then(url => fetch(url, { mode: 'cors' }))
                    .then(response => response.blob());
      
                  // Upload to new location
                  await uploadBytes(newFileRef, originalFileBlob);
                  const newUrl = await getDownloadURL(newFileRef);
                  mediaUrls.push(newUrl);
                } catch (error) {
                  console.error('Error moving file:', error);
                  // If we can't move the file, keep the original URL
                  mediaUrls.push(file);
                }
              }
            }
          }
          
          updatedEvent.mediaUrls = mediaUrls;
          
          // Update the event document
          await updateDoc(doc(db, 'events', eventId), updatedEvent);
      
          // Update the local state
          setEvents(events.map(event => 
            event.id === eventId ? updatedEvent : event
          ));
          
          setEditingEvent(null);
          setEditingMedia([]);
      
          alert('Event updated successfully!');
      
        } catch (error) {
          console.error('Error updating event:', error);
          alert('Failed to update event. Please try again.');
        }
      };

    const handlePlaceSelect = () => {
      if (autocomplete) {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
              const newCoordinates = {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
              };
              setEditingEvent(prev => ({
                  ...prev,
                  location: place.formatted_address,
                  coordinates: newCoordinates
              }));
  
              if (mapRef.current) {
                  mapRef.current.panTo(newCoordinates);
              }
          }
      }
    };

    useEffect(() => {
      if (editingEvent && mapRef.current && window.google) {
          if (markerRef.current) {
              markerRef.current.setMap(null);
          }
  
          markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
              position: editingEvent.coordinates,
              map: mapRef.current
          });
  
          mapRef.current.panTo(editingEvent.coordinates);
      }
  }, [editingEvent]);

    if (loading) {
            return <div>Yükleniyor...</div>;
        }

    return (
        <div className="my-events">
            <h2>My Events</h2>
            {events.map((event) => (
                <div key={event.id} className="event-item">
                    <div className="event-thumbnail">
                        <img src={event.thumbnailUrl} alt={event.name} />
                    </div>
                    <div className="event-content">
                        <h3>{event.name}</h3>
                        <div className="event-info">
                            <p><span>Konum:</span> {event.location}</p>
                            <p><span>Tarih:</span> {event.date}</p>
                            <p><span>Konteyjan Sınırı:</span> {event.maxCapacity}</p>
                            <p><span>Yaş Aaralığı:</span> {event.ageRange}</p>
                            <p><span>Organizatör:</span> {event.organizer}</p>
                            <div className="status-container">
                            <span>Etkinlik Durumu: </span>
                                {event.status.toLowerCase() === 'pending' && (
                                <span className={`status-badge ${event.status.toLowerCase()}`}>
                                    <i className="fas fa-clock"></i> Beklemede
                                </span>
                                )}
                                {event.status.toLowerCase() === 'approved' && (
                                <span className="status-badge approved">
                                    <i className="fas fa-check"></i> Onaylandı
                                </span>
                                )}
                            </div>
                        </div>
                        <div className="event-actions">
                            <Link to={`/etkinlik/${event.id}`} className="btn btn-view">Görüntüle</Link>
                            <Link to={`/kayıtlı-kişiler/${event.id}`} className="btn btn-view">Kayıtlı Kişileri Görüntüleyin</Link>
                            <button className="btn btn-edit" onClick={() => handleEdit(event)}>Edit</button>
                            <button className="btn btn-delete" onClick={() => handleDelete(event.id)}>Sil</button>
                        </div>
                    </div>
                </div>
            ))}
            {editingEvent && (
                <div className="edit-event-overlay">
                    <div className="edit-event-form">
                        <div className="edit-form-header">
                            <h2>Etkinlik Editi</h2>
                            <button className="close-button" onClick={() => setEditingEvent(null)}>×</button>
                        </div>

                        <div className="form-group">
                            
                        <label className="media-upload-label">Medya:</label>
                        <input 
                        type="file" 
                        multiple 
                        onChange={handleMediaChange}
                        className="media-upload-input"
                        accept="image/*,video/*"
                        />
                        <DndProvider backend={HTML5Backend}>
                        <div className="media-previews">
                            {editingMedia.map((media, index) => (
                            <MediaItem
                                key={index}
                                file={media}
                                index={index}
                                moveMedia={handleReorderMedia}
                                removeMedia={handleRemoveMedia}
                            />
                            ))}
                        </div>
                        </DndProvider>
                    </div>

                        
                        <form onSubmit={handleUpdate}>
                            <div className="form-group">
                                <label>Etkinlik Adı:</label>
                                <input 
                                    type="text" 
                                    value={editingEvent.name} 
                                    onChange={(e) => setEditingEvent({...editingEvent, name: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Organizatör:</label>
                                <input 
                                    type="text" 
                                    value={editingEvent.organizer} 
                                    onChange={(e) => setEditingEvent({...editingEvent, organizer: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Konum:</label>
                                <Autocomplete
                                    onLoad={setAutocomplete}
                                    onPlaceChanged={handlePlaceSelect}
                                >
                                    <input 
                                        type="text" 
                                        value={editingEvent.location} 
                                        onChange={(e) => setEditingEvent({...editingEvent, location: e.target.value})}
                                    />
                                </Autocomplete>
                            </div>
                            <div className="form-group map-container">
                            <GoogleMap
                              onLoad={(map) => {
                                  mapRef.current = map;
                                  if (window.google && editingEvent?.coordinates) {
                                      try {
                                          markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
                                              position: editingEvent.coordinates,
                                              map: map
                                          });
                                      } catch (error) {
                                          console.error('Error creating marker:', error);
                                      }
                                  }
                              }}
                              center={editingEvent.coordinates}
                              zoom={15}
                              mapContainerClassName="map"
                              options={{
                                mapId: "6100ebed9733d3ab",
                              }}
                          />
                            </div>
                            <div className="form-group">
                                <label>Tarih:</label>
                                <input 
                                    type="date" 
                                    value={editingEvent.date} 
                                    onChange={(e) => setEditingEvent({...editingEvent, date: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Konteyjan Sınırı:</label>
                                <input 
                                    type="number" 
                                    value={editingEvent.maxCapacity} 
                                    onChange={(e) => setEditingEvent({...editingEvent, maxCapacity: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Yaş Aralığı:</label>
                                <select 
                                    value={editingEvent.ageRange} 
                                    onChange={(e) => setEditingEvent({...editingEvent, ageRange: e.target.value})}
                                >
                                    <option value="all">Her Yaşa Uygundur</option>
                                    <option value="0-12">0-12</option>
                                    <option value="13-17">13-17</option>
                                    <option value="18+">18+</option>
                                    <option value=" 21+">21+</option>
                                </select>
                            </div>
                                
                        <div className="form-group">
                            <label>İletişim Bilgisi:</label>
                            <textarea 
                                value={editingEvent.contactInfo} 
                                onChange={(e) => setEditingEvent({...editingEvent, contactInfo: e.target.value})}
                            />
                        </div>

                        <div className="form-group">
                            <label>Açıklama:</label>
                            <textarea 
                                value={editingEvent.description} 
                                onChange={(e) => setEditingEvent({...editingEvent, description: e.target.value})}
                            />
                        </div>
                            <button type="submit" className="btn btn-save">Değişiklikleri Kaydet</button>
                        </form>
                    </div>
                </div>
            )}
            {deleteConfirmation && (
              <div className="delete-confirmation-overlay">
                  <div className="delete-confirmation">
                      <h2>Bu Etkinliği Silmek İstedğinize Emin Misiniz?</h2>
                      <div className="btn-group">
                          <button className="btn-confirm" onClick={confirmDelete}>
                              Evet, Kaldırın
                          </button>
                          <button className="btn-cancel" onClick={() => setDeleteConfirmation(null)}>
                              İptal
                          </button>
                      </div>
                  </div>
              </div>
              )}

            <h2>Kaydoluğunuz Etkinlikler</h2>
            <div className="registered-events">
                {registeredEvents.map((event) => (
                    <div key={event.id} className="registered-event-item">
                        <div className="event-thumbnail">
                            <img src={event.thumbnailUrl} alt={event.name} />
                        </div>
                        <div className="event-content">
                            <h3>{event.name}</h3>
                            <div className="event-info">
                                <p><span>Konum:</span> {event.location}</p>
                                <p><span>Tarih:</span> {event.date}</p>
                                <p><span>Organizatör:</span> {event.organizer}</p>
                                <p><span>Konteyjan Sınırı:</span> {event.maxCapacity}</p>
                                <p><span>Yaş Aralığı:</span> {event.ageRange}</p>
                            </div>
                            <div className="event-actions">
                                <Link to={`/etkinlik/${event.id}`} className="btn-view">Görüntüle</Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyEvents;