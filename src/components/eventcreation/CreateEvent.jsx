import React, { useState } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { db, storage } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { placeholder } from '../../photos';
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
    <div ref={(node) => ref(drop(node))} className={`media-item ${isThumbnail ? 'selected-thumbnail' : ''}`}>
      {file.type.startsWith('image') ? (
        <img src={URL.createObjectURL(file)} alt="preview" className="preview-image" />
      ) : (
        <video className="preview-video" controls>
          <source src={URL.createObjectURL(file)} />
        </video>
      )}
      <button type="button" className="remove-button" onClick={() => removeMedia(index)}>
        &times;
      </button>
      <div className="thumbnail-overlay" onClick={() => selectThumbnail(index)}>
        {isThumbnail ? 'Thumbnail' : 'Select as Thumbnail'}
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

  const navigate = useNavigate();

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
      let mediaUrls = [];
      let thumbnailUrl = placeholder;

      for (let i = 0; i < media.length; i++) {
        const file = media[i];
        const uniqueFileName = `${uuidv4()}_${file.name}`;
        const fileRef = ref(storage, `events/${uniqueFileName}`);
        await uploadBytes(fileRef, file);
        const fileUrl = await getDownloadURL(fileRef);
        mediaUrls.push(fileUrl);

        if (i === thumbnailIndex) {
          thumbnailUrl = fileUrl;
        }
      }

      await addDoc(collection(db, 'events'), {
        name,
        location,
        date,
        description,
        mediaUrls,
        thumbnailUrl,
      });

      setSuccess('Event created successfully!');
      setError('');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      setError('Error creating event: ' + error.message);
      setSuccess('');
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="create-event">
        <h2>Create a New Event</h2>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <form onSubmit={handleCreateEvent}>
          <label>
            Upload Event Media:
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
            placeholder="Event Name"
            required
          />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            required
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            required
          />
          <button type="submit" className='submit'>Create Event</button>
        </form>
      </div>
    </DndProvider>
  );
};

export default CreateEvent;
