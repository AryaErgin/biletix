import React, { useState } from 'react';
import { storage, db, auth } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import './ResourceCreation.css';

const ResourceCreation = () => {
  const [thumbnail, setThumbnail] = useState(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleThumbnailChange = (e) => {
    if (e.target.files[0]) {
      setThumbnail(e.target.files[0]);
    }
  };

  const handleFilesChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setSuccessMessage('');
    try {

      const user = auth.currentUser;
            if (!user) {
              return;
            }

      
      // Upload thumbnail if provided
      let thumbnailUrl = '';
      if (thumbnail) {
        const thumbRef = ref(storage, `resources/${Date.now()}_${thumbnail.name}`);
        await uploadBytes(thumbRef, thumbnail);
        thumbnailUrl = await getDownloadURL(thumbRef);
      }

      // Upload resource files and store their paths
      const filePaths = [];
      for (let file of files) {
        const fileRef = ref(storage, `resources/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        filePaths.push(fileRef.fullPath);
      }

      // Save resource data to Firestore (status is pending by default)
      await addDoc(collection(db, 'resources'), {
        thumbnailUrl,
        title,
        author,
        publishDate,
        description,
        files: filePaths,
        status: 'pending',
        createdBy: user.uid,
      });
      setSuccessMessage('Başarıyla yüklendi!');
      // Optionally clear form fields here...
    } catch (error) {
      console.error("Error creating resource:", error);
      // Optionally set an error message
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="resource-creation-form">
      <h2>İçerik Oluştur</h2>
      <form onSubmit={handleSubmit}>
        <label>Başlık Resmi:</label>
        <input type="file" accept="image/*" onChange={handleThumbnailChange} required />

        <label>Başlık:</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <label>Oluşturan:</label>
        <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} required />

        <label>Yayınlama Tarihi:</label>
        <input type="text" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} required />

        <label>Açıklama:</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />

        <label>Dosyalar (PDF, JPG, PNG, MP3, MP4):</label>
        <input type="file" accept=".pdf, image/*, audio/*, video/*" multiple onChange={handleFilesChange} required />

        <button type="submit" disabled={uploading} className="submit">
          {uploading ? "Uploading..." : "Kaynak Yükle"}
        </button>

        {successMessage && <div className="success-message">{successMessage}</div>}
      </form>
    </div>
  );
};

export default ResourceCreation;
