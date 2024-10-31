import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [password, setPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();
  const [changeusername, setChangeUsername] = useState("");
  const [changeAge, setChangeAge] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate("/giriş-yap");
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/");
    } catch (error) {
      setError("Çıkış yapılırken bir hata oluştu.");
    }
  };

  const handlePasswordReset = async () => {
    if (!user) {
      setError("User not found. Please try logging in again.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetSent(true);
      setSuccessMessage("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
      setError(null);
    } catch (error) {
      setError("Şifre sıfırlama e-postası gönderilirken bir hata oluştu: " + error.message);
      setSuccessMessage(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user.emailVerified) {
      setError("Hesabınızı silmek için önce e-posta adresinizi doğrulamanız gerekmektedir.");
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      await deleteDoc(doc(db, "users", user.uid));

      await deleteUser(user);

      setSuccessMessage("Hesabınız başarıyla silindi.");
      navigate("/");
    } catch (error) {
      setError("Hesap silinirken bir hata oluştu. Lütfen şifrenizi kontrol edin ve tekrar deneyin.");
    }
  };

  if (!user) {
    return <div className="profile-loading">Yükleniyor...</div>;
  }

  const updateProfile = async () => {
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        username: changeusername,
        age: parseInt(changeAge),
      });
      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");
    } catch (error) {
      setError("Failed to update profile");
    }
  };

  return (
    <div className="profile-container">
      <h2>Profil Bilgileri</h2>
      
      <div className="profile-info">
        <div className="info-group">
          <label>E-posta:</label>
          <p>{user.email}</p>
        </div>

        {isEditing ? (
      <>
        <div className="info-group">
          <label>İsim</label>
          <input
            type="text"
            value={user.username}
            onChange={(e) => setChangeUsername(e.target.value)}
            className="profile-input"
          />
        </div>
        <div className="info-group">
          <label>Yaş</label>
          <input
            type="number"
            value={user.age}
            onChange={(e) => setChangeAge(e.target.value)}
            min="13"
            max="120"
            className="profile-input"
          />
        </div>
        <button onClick={updateProfile} className="save-profile-btn">Değişiklikleri Kaydet</button>
        <button onClick={() => setIsEditing(false)} className="cancel-edit-btn">İptal</button>
      </>
    ) : (
      <>
        <div className="info-group">
          <label>İsim</label>
          <p>{user.username}</p>
        </div>
        <div className="info-group">
          <label>Yaş</label>
          <p>{user.age}</p>
        </div>
        <button onClick={() => setIsEditing(true)} className="edit-profile-btn">Edit</button>
      </>
    )}

        <div className="info-group">
          <label>Hesap Oluşturma Tarihi:</label>
          <p>{new Date(user.metadata.creationTime).toLocaleString('tr-TR')}</p>
        </div>

        <div className="info-group">
          <label>Son Giriş Tarihi:</label>
          <p>{new Date(user.metadata.lastSignInTime).toLocaleString('tr-TR')}</p>
        </div>

        {user.emailVerified ? (
          <div className="verification-status verified">
            ✓ E-posta Doğrulandı
          </div>
        ) : (
          <div className="verification-status not-verified">
            ✗ E-posta Doğrulanmadı
          </div>
        )}
      </div>

      <div className="profile-actions">
        <button 
          className="password-reset-btn" 
          onClick={handlePasswordReset}
          disabled={resetSent}
        >
          {resetSent ? "Sıfırlama Bağlantısı Gönderildi" : "Şifreyi Sıfırla"}
        </button>

        <button className="logout-btn" onClick={handleLogout}>
          Çıkış Yap
        </button>

        <button 
          className="delete-account-btn" 
          onClick={() => setShowDeleteConfirm(true)}
          disabled={!user.emailVerified}
        >
          Hesabı Sil
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="delete-confirm">
          <p>Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
          <input className="passwordinp"
            type="password"
            placeholder="Şifrenizi girin"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleDeleteAccount}>Hesabı Sil</button>
          <button onClick={() => setShowDeleteConfirm(false)}>İptal</button>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
    </div>
  );
};

export default Profile;