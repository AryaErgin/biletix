import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import './ResourceDetail.css'; // Use a CSS file based on your eventdetail.css but with resource-specific class names
import { placeholder } from '../../photos';

const ResourceDetail = () => {
  const { resourceId } = useParams();
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

  const handleDownloadAll = async () => {
    if (resource && resource.files && resource.files.length > 0) {
      try {
        const filesToDownload = await Promise.all(
          resource.files.map(async (filePath) => {
            const fileRef = ref(storage, filePath);
            const url = await getDownloadURL(fileRef);
            // Fetch the file as a blob
            const response = await fetch(url);
            const blob = await response.blob();
            // Get the full file name from the path
            const fullFilename = filePath.split('/').pop();
            // Remove the initial part before the first underscore
            let filename = fullFilename;
            const underscoreIndex = fullFilename.indexOf('_');
            if (underscoreIndex !== -1) {
              filename = fullFilename.substring(underscoreIndex + 1);
            }
            return { blob, filename };
          })
        );
        filesToDownload.forEach(({ blob, filename }) => {
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename; // Use the filename without the id
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
        });
      } catch (error) {
        console.error("Error downloading files:", error);
      }
    }
  };

  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!resource) {
    return <div>Resource not found</div>;
  }

  return (
    <div className="resource-detail">
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
      <button className="download-button" onClick={handleDownloadAll}>
        İndir
      </button>
    </div>
  );
};

export default ResourceDetail;
