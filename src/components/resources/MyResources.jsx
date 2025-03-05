import React, { useEffect, useState } from 'react';
import { auth, db, storage } from '../../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { deleteObject, ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';
import './MyResources.css';

const MediaItem = ({ file, index, moveMedia, removeMedia }) => {
  const [, dragRef] = useDrag({
    type: 'media',
    item: { index },
  });

  const [, dropRef] = useDrop({
    accept: 'media',
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveMedia(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <div ref={(node) => dragRef(dropRef(node))} className="media-items">
      {typeof file === 'string' ? (
        file.includes('mp4') ? (
          <video src={file} className="preview-media" controls muted />
        ) : (
          <img src={file} alt="preview" className="preview-media" />
        )
      ) : file.type.startsWith('video') ? (
        <video src={URL.createObjectURL(file)} className="preview-media" controls muted onLoadedMetadata={(e) => e.target.muted = false} />
      ) : (
        <img src={URL.createObjectURL(file)} alt="preview" className="preview-media" />
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

const MyResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingResource, setEditingResource] = useState(null);
  const [editingMedia, setEditingMedia] = useState([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  // Fetch only resources created by the current user
  useEffect(() => {
    const fetchResources = async () => {
      const user = auth.currentUser;
      if (user) {
        const q = query(
          collection(db, 'resources'),
          where('createdBy', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const resourceList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setResources(resourceList);
      }
      setLoading(false);
    };

    fetchResources();
  }, []);

  const handleDelete = (resourceId) => {
    setDeleteConfirmation(resourceId);
  };

  const confirmDelete = async () => {
    try {
      const resourceDoc = await getDoc(doc(db, 'resources', deleteConfirmation));
      if (!resourceDoc.exists()) throw new Error('Resource not found');
      const resourceData = resourceDoc.data();

      // Delete all media files
      if (resourceData.mediaUrls && resourceData.mediaUrls.length > 0) {
        await Promise.all(
          resourceData.mediaUrls.map(async (url) => {
            try {
              const fileRef = ref(storage, url);
              await deleteObject(fileRef);
            } catch (error) {
              console.error('Error deleting file:', error);
            }
          })
        );
      }
      // Delete thumbnail
      if (resourceData.thumbnailUrl) {
        try {
          const thumbRef = ref(storage, resourceData.thumbnailUrl);
          await deleteObject(thumbRef);
        } catch (error) {
          console.error('Error deleting thumbnail:', error);
        }
      }
      await deleteDoc(doc(db, 'resources', deleteConfirmation));
      setResources(resources.filter(res => res.id !== deleteConfirmation));
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('Error during resource deletion:', error);
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    // Load existing media into the editing state
    setEditingMedia(resource.mediaUrls || []);
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    setEditingMedia(prev => [...prev, ...files]);
  };

  const handleRemoveMedia = (index) => {
    setEditingMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleReorderMedia = (fromIndex, toIndex) => {
    setEditingMedia(prev => {
      const updatedMedia = [...prev];
      const [movedItem] = updatedMedia.splice(fromIndex, 1);
      updatedMedia.splice(toIndex, 0, movedItem);
      return updatedMedia;
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updatedResource = { ...editingResource };
      const resourceId = editingResource.id;
      const sanitizedTitle = updatedResource.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const resourceDirectory = `resources/${resourceId}_${sanitizedTitle}`;

      // Process media uploads (new files and keep existing ones)
      const mediaUrls = [];
      for (let file of editingMedia) {
        if (file instanceof File) {
          const uniqueFileName = `${uuidv4()}_${file.name}`;
          const fileRef = ref(storage, `${resourceDirectory}/${uniqueFileName}`);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          mediaUrls.push(url);
        } else if (typeof file === 'string') {
          mediaUrls.push(file);
        }
      }
      updatedResource.mediaUrls = mediaUrls;

      await updateDoc(doc(db, 'resources', resourceId), updatedResource);
      setResources(resources.map(res => res.id === resourceId ? updatedResource : res));
      setEditingResource(null);
      setEditingMedia([]);
      alert('Resource güncellendi!');
    } catch (error) {
      console.error('Error updating resource:', error);
      alert('Resource güncelleme başarısız. Lütfen tekrar deneyin.');
    }
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="my-resources">
      <h2>My Resources</h2>
      {resources.length === 0 ? (
        <p>Hiç resource bulunamadı.</p>
      ) : (
        resources.map(resource => (
          <div key={resource.id} className="resource-item">
            <div className="resource-thumbnail">
              <img src={resource.thumbnailUrl} alt={resource.title} />
            </div>
            <div className="resource-content">
              <h3>{resource.title}</h3>
              <div className="resource-info">
                <p><span>Yazar:</span> {resource.author}</p>
                <p><span>Yayın Tarihi:</span> {resource.publishDate}</p>
                <p><span>Durum:</span> {resource.status}</p>
              </div>
              <div className="resource-actions">
                <Link to={`/resource/${resource.id}`} className="btn btn-view">
                  Görüntüle
                </Link>
                <button className="btn btn-edit" onClick={() => handleEdit(resource)}>
                  Düzenle
                </button>
                <button className="btn btn-delete" onClick={() => handleDelete(resource.id)}>
                  Sil
                </button>
              </div>
            </div>
          </div>
        ))
      )}
      {/* Edit Resource Popup */}
      {editingResource && (
        <div className="edit-resource-overlay">
          <div className="edit-resource-form">
            <div className="edit-form-header">
              <h2>Resource Düzenle</h2>
              <button className="close-button" onClick={() => setEditingResource(null)}>×</button>
            </div>
            <div className="form-group">
              <label className="media-upload-label">Medya Yükle:</label>
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
                <label>Resource Başlığı:</label>
                <input
                  type="text"
                  value={editingResource.title}
                  onChange={(e) => setEditingResource({ ...editingResource, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Yazar:</label>
                <input
                  type="text"
                  value={editingResource.author}
                  onChange={(e) => setEditingResource({ ...editingResource, author: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Yayın Tarihi:</label>
                <input
                  type="date"
                  value={editingResource.publishDate}
                  onChange={(e) => setEditingResource({ ...editingResource, publishDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Açıklama:</label>
                <textarea
                  value={editingResource.description}
                  onChange={(e) => setEditingResource({ ...editingResource, description: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-save">Değişiklikleri Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete confirmation overlay */}
      {deleteConfirmation && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation">
            <h2>Bu Resource'ı Silmek İstediğinize Emin Misiniz?</h2>
            <div className="btn-group">
              <button className="btn-confirm" onClick={confirmDelete}>Evet, Sil</button>
              <button className="btn-cancel" onClick={() => setDeleteConfirmation(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyResources;
