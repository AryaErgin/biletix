import React, { useEffect, useRef, useState } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { auth, db, storage } from '../../../firebase';
import { collection, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { GoogleMap, Autocomplete } from '@react-google-maps/api';
import { placeholder } from '../../../photos';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import './CreateEvent.css';

const MediaItem = ({ file, index, moveMedia, removeMedia, isThumbnail, selectThumbnail }) => {
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
    <div 
      ref={(node) => ref(drop(node))} 
      className={`media-item ${isThumbnail ? 'selected-thumbnail' : ''}`}
    >
      {file.type.startsWith('image') ? (
        <img src={URL.createObjectURL(file)} alt="preview" className="preview-image" />
      ) : (
        <video className="preview-video" controls>
          <source src={URL.createObjectURL(file)} />
        </video>
      )}
      <div className="media-item-details">
        <span>{file.name}</span>
        <button type="button" className="remove-button" onClick={() => removeMedia(index)}>
          X
        </button>
        <button type="button" className="thumbnail-button" onClick={() => selectThumbnail(index)}>
          {isThumbnail ? 'Current Thumbnail' : 'Set as Thumbnail'}
        </button>
      </div>
    </div>
  );
};


const CreateEvent = () => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [media, setMedia] = useState([]);
  const [description, setDescription] = useState('');
  const [thumbnailIndex, setThumbnailIndex] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const navigate = useNavigate();
  const [locationSelected, setLocationSelected] = useState(false);
  const ANKARA_COORDINATES = { lat: 39.9334, lng: 32.8597 };
  const [maxCapacity, setMaxCapacity] = useState('');
  const [ageRange, setAgeRange] = useState('all');
  const [organizer, setOrganizer] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  const handleMaxCapacityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value <= 0) {
      setMaxCapacity('1');
    } else {
      setMaxCapacity(e.target.value);
    }
  };

  const handleAgeRangeChange = (e) => setAgeRange(e.target.value);

  const handlePlaceSelect = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const newCoordinates = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        setCoordinates(newCoordinates);
        setLocation(place.formatted_address);
        setLocationSelected(true);

        if (mapRef.current) {
          mapRef.current.panTo(newCoordinates);
        }
      }
    }
  };

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, []);

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    setMedia((prevMedia) => [...prevMedia, ...files]);
  };

  const handleRemoveMedia = (index) => {
    setMedia((prevMedia) => prevMedia.filter((_, i) => i !== index));
    if (index === thumbnailIndex) {
      setThumbnailIndex(null);
    } else if (index < thumbnailIndex) {
      setThumbnailIndex((prev) => prev - 1);
    }
  };

  const handleSelectThumbnail = (index) => {
    if (media[index].type.startsWith('video')) {
      setError('Videos cannot be used as thumbnails. Please select an image.');
      return;
    }
    setThumbnailIndex(index);
  };

  const handleReorderMedia = (fromIndex, toIndex) => {
    const reorderedMedia = Array.from(media);
    const [movedMedia] = reorderedMedia.splice(fromIndex, 1);
    reorderedMedia.splice(toIndex, 0, movedMedia);
    setMedia(reorderedMedia);
    if (fromIndex === thumbnailIndex) {
      setThumbnailIndex(toIndex);
    } else if (fromIndex < thumbnailIndex && toIndex >= thumbnailIndex) {
      setThumbnailIndex((prev) => prev - 1);
    } else if (fromIndex > thumbnailIndex && toIndex <= thumbnailIndex) {
      setThumbnailIndex((prev) => prev + 1);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('You must be logged in to create an event.');
        return;
      }

      const eventDoc = await addDoc(collection(db, 'events'), {
        name,
        userEmail: user.email,
        location,
        coordinates,
        date,
        maxCapacity,
        ageRange,
        description,
        mediaUrls: [],
        thumbnailUrl: '',
        organizer,
        status: "pending",
        createdBy: user.uid,
        contactInfo,
      });

      const eventId = eventDoc.id;
      const sanitizedEventName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const eventDirectory = `events/${eventId}_${sanitizedEventName}`;

      let mediaUrls = [];
      let thumbnailUrl = placeholder;

      for (let i = 0; i < media.length; i++) {
        const file = media[i];
        const uniqueFileName = `${uuidv4()}_${file.name}`;
        const fileRef = ref(storage, `${eventDirectory}/${uniqueFileName}`);
        await uploadBytes(fileRef, file);
        const fileUrl = await getDownloadURL(fileRef);
        mediaUrls.push(fileUrl);

        if (i === thumbnailIndex) {
          thumbnailUrl = fileUrl;
        }
      }

      await updateDoc(eventDoc, {
        mediaUrls,
        thumbnailUrl,
      });

      setSuccess('Event submitted for approval!');
      setError('');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('Error creating event:', error);
      setError('Error creating event: ' + error.message);
      setSuccess('');
    }
  };

  const onMapLoad = (map) => {
    mapRef.current = map;
    
    if (window.google) {
      try {
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }
        markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
          position: coordinates,
          map: map
        });
      } catch (error) {
        console.error('Error creating marker:', error);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const createMarker = async () => {
      if (mapRef.current && coordinates && locationSelected && window.google) {
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }

        try {
          if (window.google.maps.marker) {
            markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
              position: coordinates,
              map: mapRef.current,
            });
          } else {
            markerRef.current = new window.google.maps.Marker({
              position: coordinates,
              map: mapRef.current,
            });
          }
        } catch (error) {
          console.error('Error creating marker:', error);
        }
      }
    };

    createMarker();
  }, [coordinates, locationSelected]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="create-event">
        <h2>Yeni Etkinlik Oluştur</h2>
        
        <form onSubmit={handleCreateEvent}>
          <label>
            Etkinlik Hakkında Fotoğraf veya Video Ekleyin:
            <input type="file" accept="image/*,video/*" multiple onChange={handleMediaChange} />
          </label>
          <div className="media-preview">
            {media.map((file, index) => (
              <MediaItem
                key={index}
                file={file}
                index={index}
                moveMedia={handleReorderMedia}
                removeMedia={handleRemoveMedia}
                isThumbnail={index === thumbnailIndex}
                selectThumbnail={handleSelectThumbnail}
              />
            ))}
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Etkinlik Adı"
            required
          />

          <input
            type="text"
            value={organizer}
            onChange={(e) => setOrganizer(e.target.value)}
            placeholder="Organizatör"
            required
          />
          
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

        <input
          type="number"
          value={maxCapacity}
          onChange={handleMaxCapacityChange}
          placeholder="Maksimum Kapasite"
          min="1"
          required
        />

      <label>
        Yaş Aralığı:
        <select value={ageRange} onChange={handleAgeRangeChange}>
          <option value="all">Her Yaşa Uygundur</option>
          <option value="0-12">0-12</option>
          <option value="13-17">13-17</option>
          <option value="18+">18+</option>
          <option value="21+">21+</option>
        </select>
      </label>

      <textarea
        type="text"
        value={contactInfo}
        onChange={(e) => setContactInfo(e.target.value)}
        placeholder="İletişim Bilgisi"
        required
      />

          <div className="location-section">
            <Autocomplete
              onLoad={setAutocomplete}
              onPlaceChanged={handlePlaceSelect}
            >
              <input
                type="text"
                placeholder="Etkinlik Konumu"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </Autocomplete>

            <div className="map-container">
              <GoogleMap
                onLoad={onMapLoad}
                mapContainerClassName="map"
                center={coordinates || ANKARA_COORDINATES}
                zoom={15}
                options={{
                  mapId: "6100ebed9733d3ab",
                }}
              />
            </div>
          </div>
          
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Etkinlik Bilgileri"
            required
          />
          <button type="submit" className='submit' data-text="Create Event">Create Event</button>
        </form>
        {error && (
          <div className="message-container error">
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="message-container success">
            <p>{success}</p>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default CreateEvent;