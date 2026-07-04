// components/Admin/AppManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSpinner, 
  FaCheckCircle,
  FaTimes,
  FaFileDownload,
  FaUpload,
  FaCloudUploadAlt,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaCalendarAlt,
  FaTag
} from 'react-icons/fa';
import axios from 'axios';
import { useToast } from '../../assets/toastnotification';
import '../../styles/Admin/appManagement.css';

const AppManagement = ({ config, onConfigUpdate, savingConfig }) => {
  const { toast, showToast } = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [formData, setFormData] = useState({
    version: '',
    releaseNotes: '',
    status: 'draft'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appToDelete, setAppToDelete] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/applications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApplications(response.data.apps || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      showToast('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (app = null) => {
    if (app) {
      setEditingApp(app);
      setFormData({
        version: app.version,
        releaseNotes: app.releaseNotes || '',
        status: app.status || 'draft'
      });
      setSelectedFile(null);
    } else {
      setEditingApp(null);
      setFormData({
        version: '',
        releaseNotes: '',
        status: 'draft'
      });
      setSelectedFile(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingApp(null);
    setFormData({
      version: '',
      releaseNotes: '',
      status: 'draft'
    });
    setSelectedFile(null);
    setUploading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file is APK
      if (!file.name.endsWith('.apk')) {
        showToast('Please select an APK file', 'warning');
        e.target.value = '';
        return;
      }
      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        showToast('File size must be less than 100MB', 'warning');
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    // Validate
    if (!formData.version.trim()) {
      showToast('Please enter a version number', 'warning');
      return;
    }

    if (!editingApp && !selectedFile) {
      showToast('Please select an APK file', 'warning');
      return;
    }

    if (!formData.releaseNotes.trim()) {
      showToast('Please enter release notes', 'warning');
      return;
    }

    setUploading(true);

    try {
      const token = sessionStorage.getItem('token');
      const formDataToSend = new FormData();
      formDataToSend.append('version', formData.version);
      formDataToSend.append('releaseNotes', formData.releaseNotes);
      formDataToSend.append('status', formData.status);
      
      if (selectedFile) {
        formDataToSend.append('apkFile', selectedFile);
      }

      let response;
      if (editingApp) {
        // Update existing app
        response = await axios.put(
          `${import.meta.env.VITE_API_URL}/api/applications/${editingApp._id}`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      } else {
        // Create new app
        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/applications`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }

      showToast(response.data.message, 'success');
      handleCloseModal();
      fetchApplications();
      
      // If config needs refresh
      if (onConfigUpdate) {
        onConfigUpdate();
      }
    } catch (error) {
      console.error('Error saving application:', error);
      showToast(error.response?.data?.message || 'Failed to save application', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!appToDelete) return;

    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/applications/${appToDelete._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToast(response.data.message, 'success');
      setShowDeleteModal(false);
      setAppToDelete(null);
      fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      showToast(error.response?.data?.message || 'Failed to delete application', 'error');
    }
  };

  const handlePublish = async (app) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/applications/${app._id}/publish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToast(response.data.message, 'success');
      fetchApplications();
    } catch (error) {
      console.error('Error publishing app:', error);
      showToast(error.response?.data?.message || 'Failed to publish app', 'error');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    if (status === 'published') {
      return <span className="status-badge published"><FaCheck /> Published</span>;
    }
    return <span className="status-badge draft"><FaEyeSlash /> Draft</span>;
  };

  if (loading) {
    return (
      <div className="app-management-loading">
        <FaSpinner className="spinner" /> Loading applications...
      </div>
    );
  }

  return (
    <div className="app-management-integrated">
      <div className="app-management-header">
        <div className="header-info">
          <h4>Android APK Management</h4>
          <p>Upload and manage APK versions for your mobile application</p>
        </div>
        <button 
          className="btn-add-app" 
          onClick={() => handleOpenModal()}
          disabled={savingConfig}
        >
          <FaPlus /> Upload New APK
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="empty-apps">
          <FaCloudUploadAlt />
          <p>No applications uploaded yet</p>
          <p className="empty-sub">Upload your first APK to get started</p>
        </div>
      ) : (
        <div className="apps-table-wrapper">
          <table className="apps-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Release Notes</th>
                <th>Release Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app._id} className={app.status === 'published' ? 'published-row' : ''}>
                  <td>
                    <div className="version-cell">
                      <FaTag /> v{app.version}
                    </div>
                  </td>
                  <td>
                    <div className="release-notes-cell" title={app.releaseNotes}>
                      {app.releaseNotes}
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      <FaCalendarAlt /> {formatDate(app.releaseDate)}
                    </div>
                  </td>
                  <td>{getStatusBadge(app.status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn edit" 
                        onClick={() => handleOpenModal(app)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="action-btn delete" 
                        onClick={() => {
                          setAppToDelete(app);
                          setShowDeleteModal(true);
                        }}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                      {app.status !== 'published' && (
                        <button 
                          className="action-btn publish" 
                          onClick={() => handlePublish(app)}
                          title="Publish"
                        >
                          <FaCheck />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content app-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingApp ? 'Edit' : 'Upload New'} APK</h3>
              <button className="modal-close" onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Version *</label>
                <input
                  type="text"
                  placeholder="e.g., 1.0.0"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                />
              </div>

              {!editingApp && (
                <div className="form-group">
                  <label>APK File *</label>
                  <div className="file-upload-wrapper">
                    <input
                      type="file"
                      accept=".apk"
                      onChange={handleFileChange}
                      className="file-input"
                      id="apk-file-input"
                    />
                    <label htmlFor="apk-file-input" className="file-upload-label">
                      <FaUpload />
                      {selectedFile ? selectedFile.name : 'Choose APK file...'}
                    </label>
                    {selectedFile && (
                      <span className="file-size">
                        ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    )}
                  </div>
                  <small className="file-hint">Max file size: 100MB</small>
                </div>
              )}

              {editingApp && (
                <div className="form-group">
                  <label>Current APK</label>
                  <div className="current-apk-info">
                    <FaFileDownload />
                    <span>{editingApp.fileName || 'APK file'}</span>
                    <a 
                      href={editingApp.apkUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="download-link"
                    >
                      Download
                    </a>
                  </div>
                  <small>Upload a new file to replace the current APK (optional)</small>
                  <div className="file-upload-wrapper">
                    <input
                      type="file"
                      accept=".apk"
                      onChange={handleFileChange}
                      className="file-input"
                      id="apk-file-input-edit"
                    />
                    <label htmlFor="apk-file-input-edit" className="file-upload-label">
                      <FaUpload />
                      {selectedFile ? selectedFile.name : 'Choose new APK file...'}
                    </label>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Release Notes *</label>
                <textarea
                  rows="4"
                  placeholder="Describe what's new in this version..."
                  value={formData.releaseNotes}
                  onChange={(e) => setFormData({ ...formData, releaseNotes: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                <small>Only one version can be published at a time</small>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={handleCloseModal}>
                Cancel
              </button>
              <button 
                className="btn-confirm" 
                onClick={handleSubmit}
                disabled={uploading}
              >
                {uploading ? <FaSpinner className="spinner" /> : <FaCheckCircle />}
                {editingApp ? 'Update' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && appToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Application</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimes />
              </button>
            </div>
            <p>
              Are you sure you want to delete version <strong>v{appToDelete.version}</strong>?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn-confirm btn-danger" onClick={handleDelete}>
                <FaTrash /> Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppManagement;