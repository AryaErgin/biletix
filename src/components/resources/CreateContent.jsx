import { useNavigate } from 'react-router-dom';
import './CreateContent.css';

const CreateContent = () => {
  const navigate = useNavigate();

  return (
    <div className="create-content-container">
      <div className="create-content-options">
        <div className="create-content-box" onClick={() => navigate('/etkinlik-oluştur')}>
          <h3>Etkinlik Oluştur</h3>
          <p>Bir Etkinlik Planlayın ve Düzenleyin</p>
        </div>
        <div className="create-content-box" onClick={() => navigate('/resource-oluştur')}>
          <h3>Kaynak Oluştur</h3>
          <p>Yeni Kaynak Materyallari Yayınla</p>
        </div>
      </div>
    </div>
  );
};

export default CreateContent;
