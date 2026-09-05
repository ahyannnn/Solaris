// components/Admin/AppManagement.jsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaCheckCircle,
  FaFileDownload,
  FaUpload,
  FaCloudUploadAlt,
  FaEyeSlash,
  FaCheck,
  FaCalendarAlt,
  FaTag,
  FaAndroid,
  FaDownload,
  FaChevronDown
} from 'react-icons/fa';
import axios from 'axios';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Admin/appManagement.css';

const AppManagement = ({ config, onConfigUpdate, savingConfig }) => {
  const { toast, showToast, hideToast } = useToast();
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
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 20 });
  const buttonRefs = useRef({});
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchApplications();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };

    const handleScroll = () => {
      setOpenDropdownId(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  // Lock body scroll + close on Escape while any modal is open.
  // Modals are portalled to document.body so position:fixed stays
  // viewport-relative and isn't trapped by ancestor backdrop-filter
  // (e.g. .system-config-admain glass effect which creates a
  // containing block for fixed descendants).
  useEffect(() => {
    const anyModalOpen = showModal || showDeleteModal;
    if (!anyModalOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (uploading || uploadStatus === 'uploading' || uploadStatus === 'waiting') return;
        setShowModal(false);
        setShowDeleteModal(false);
      }
    };
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showModal, showDeleteModal, uploading, uploadStatus]);

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
    setUploadStatus('idle');
    setShowModal(true);
    setOpenDropdownId(null);
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
    setUploadStatus('idle');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.apk')) {
        showToast('Please select an APK file', 'warning');
        e.target.value = '';
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        showToast('File size must be less than 100MB', 'warning');
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
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

    const currentCount = applications.length;
    setUploading(true);
    setUploadStatus('uploading');

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

      setUploadStatus('waiting');

      let attempts = 0;
      const maxAttempts = 10;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const verifyToken = sessionStorage.getItem('token');
          const verifyResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/applications`,
            { headers: { Authorization: `Bearer ${verifyToken}` } }
          );

          const newApps = verifyResponse.data.apps || [];
          const newCount = newApps.length;

          if (!editingApp && newCount === currentCount + 1) {
            clearInterval(pollInterval);
            setUploadStatus('success');
            setApplications(newApps);

            setTimeout(() => {
              handleCloseModal();
              showToast('APK uploaded successfully!', 'success');
              if (onConfigUpdate) onConfigUpdate();
            }, 1500);
          }
          else if (editingApp) {
            const stillExists = newApps.some(app => app._id === editingApp._id);
            if (stillExists) {
              clearInterval(pollInterval);
              setUploadStatus('success');
              setApplications(newApps);

              setTimeout(() => {
                handleCloseModal();
                showToast('APK updated successfully!', 'success');
                if (onConfigUpdate) onConfigUpdate();
              }, 1500);
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
        }

        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setUploadStatus('idle');
          showToast('Verification timeout. Please refresh the list.', 'warning');
          handleCloseModal();
        }
      }, 1000);

    } catch (error) {
      console.error('Error saving application:', error);
      showToast(error.response?.data?.message || 'Failed to save application', 'error');
      setUploading(false);
      setUploadStatus('idle');
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
      setOpenDropdownId(null);
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
      setOpenDropdownId(null);
      fetchApplications();
    } catch (error) {
      console.error('Error publishing app:', error);
      showToast(error.response?.data?.message || 'Failed to publish app', 'error');
    }
  };

  const handleDropdownClick = (event, appId) => {
    event.stopPropagation();
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: buttonRect.bottom + 5,
      right: window.innerWidth - buttonRect.right - 10,
    });
    setOpenDropdownId(openDropdownId === appId ? null : appId);
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
      return <span className="status-badge-app-admin published"><FaCheck /> Published</span>;
    }
    return <span className="status-badge-app-admin draft"><FaEyeSlash /> Draft</span>;
  };

  // Get available actions for an app
  const getAvailableActions = (app) => {
    const actions = [
      {
        label: 'Edit',
        icon: <FaEdit />,
        action: () => handleOpenModal(app),
        color: 'primary'
      }
    ];

    // Only show download if APK URL exists
    if (app.apkUrl) {
      actions.push({
        label: 'Download APK',
        icon: <FaDownload />,
        action: () => window.open(app.apkUrl, '_blank'),
        color: 'primary'
      });
    }

    // Only show publish if not already published
    if (app.status !== 'published') {
      actions.push({
        label: 'Publish',
        icon: <FaCheck />,
        action: () => handlePublish(app),
        color: 'success'
      });
    }

    // Only show delete if not published
    if (app.status !== 'published') {
      actions.push({
        label: 'Delete',
        icon: <FaTrash />,
        action: () => {
          setAppToDelete(app);
          setShowDeleteModal(true);
          setOpenDropdownId(null);
        },
        color: 'danger'
      });
    }

    return actions;
  };

  if (loading) {
    return (
      <div className="app-management-app-admin loading-state-app-admin">
        <FaSpinner className="spinner-app-admin" /> Loading applications...
      </div>
    );
  }

  return (
    <div className="app-management-app-admin">
      {/* --- Header --- */}
      <div className="app-header-app-admin">
        <div className="app-header-info-app-admin">
          <h4>Android APK Management</h4>
          <p>Upload and manage APK versions for your mobile application</p>
        </div>
        <button
          className="fab-add-app-app-admin"
          onClick={() => handleOpenModal()}
          disabled={savingConfig}
        >
          <FaPlus /> New APK
        </button>
      </div>

      {/* --- Empty State --- */}
      {applications.length === 0 ? (
        <div className="app-empty-app-admin">
          <FaCloudUploadAlt className="empty-icon-app-admin" />
          <h3>No Applications Uploaded</h3>
          <p>Upload your first APK to get started</p>
        </div>
      ) : (
        /* --- Data Table --- */
        <div className="app-table-wrapper-app-admin">
          <table className="app-table-app-admin">
            <thead>
              <tr>
                <th>Version</th>
                <th>Release Notes</th>
                <th>Release Date</th>
                <th>Status</th>
                <th className="actions-col-app-admin">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const isOpen = openDropdownId === app._id;
                const actions = getAvailableActions(app);
                const isPublished = app.status === 'published';

                return (
                  <tr key={app._id} className={isPublished ? 'published-row-app-admin' : ''}>
                    <td>
                      <div className="version-cell-app-admin">
                        <FaAndroid className="version-icon-app-admin" /> v{app.version}
                      </div>
                    </td>
                    <td>
                      <div className="release-notes-cell-app-admin" title={app.releaseNotes}>
                        {app.releaseNotes}
                      </div>
                    </td>
                    <td>
                      <div className="date-cell-app-admin">
                        <FaCalendarAlt /> {formatDate(app.releaseDate)}
                      </div>
                    </td>
                    <td>{getStatusBadge(app.status)}</td>
                    <td>
                      <div className="action-dropdown-container-app-admin">
                        <button
                          className="action-dropdown-toggle-app-admin"
                          ref={el => buttonRefs.current[app._id] = el}
                          onClick={(e) => handleDropdownClick(e, app._id)}
                        >
                          Actions <FaChevronDown className={`dropdown-arrow-app-admin ${isOpen ? 'open-app-admin' : ''}`} />
                        </button>

                        {isOpen && (
                          <div
                            className="action-dropdown-menu-app-admin"
                            ref={dropdownRef}
                          > 
                            {actions.map((action, idx) => (
                              <button
                                key={idx}
                                className={`dropdown-item-app-admin ${action.color || ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  action.action();
                                }}
                              >
                                {action.icon} <span>{action.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================
          MODALS
         ============================================ */}

      {/* Add/Edit Modal - portalled to body so overlay covers full viewport */}
      {showModal && createPortal(
        <div className="modal-overlay-app-admin" onClick={handleCloseModal}>
          <div className="modal-content-app-admin app-modal-app-admin" onClick={e => e.stopPropagation()}>
            <div className="modal-header-app-admin">
              <h3>{editingApp ? 'Edit' : 'Upload New'} APK</h3>
              <button className="modal-close-app-admin" onClick={handleCloseModal}>×</button>
            </div>

            <div className="modal-body-app-admin">
              <div className="form-group-app-admin">
                <label>Version *</label>
                <input
                  type="text"
                  placeholder="e.g., 1.0.0"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                />
              </div>

              {!editingApp && (
                <div className="form-group-app-admin">
                  <label>APK File *</label>
                  <div className="file-upload-wrapper-app-admin">
                    <input
                      type="file"
                      accept=".apk"
                      onChange={handleFileChange}
                      className="file-input-app-admin"
                      id="apk-file-input"
                    />
                    <label htmlFor="apk-file-input" className="file-upload-label-app-admin">
                      <FaUpload />
                      {selectedFile ? selectedFile.name : 'Choose APK file...'}
                    </label>
                    {selectedFile && (
                      <span className="file-size-app-admin">
                        ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    )}
                  </div>
                  <small className="file-hint-app-admin">Max file size: 100MB</small>
                </div>
              )}

              {editingApp && (
                <div className="form-group-app-admin">
                  <label>Current APK</label>
                  <div className="current-apk-info-app-admin">
                    <FaFileDownload />
                    <span>{editingApp.fileName || 'APK file'}</span>
                    {editingApp.apkUrl && (
                      <a
                        href={editingApp.apkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="download-link-app-admin"
                      >
                        Download
                      </a>
                    )}
                  </div>
                  <small>Upload a new file to replace the current APK (optional)</small>
                  <div className="file-upload-wrapper-app-admin">
                    <input
                      type="file"
                      accept=".apk"
                      onChange={handleFileChange}
                      className="file-input-app-admin"
                      id="apk-file-input-edit"
                    />
                    <label htmlFor="apk-file-input-edit" className="file-upload-label-app-admin">
                      <FaUpload />
                      {selectedFile ? selectedFile.name : 'Choose new APK file...'}
                    </label>
                  </div>
                </div>
              )}

              <div className="form-group-app-admin">
                <label>Release Notes *</label>
                <textarea
                  rows="4"
                  placeholder="Describe what's new in this version..."
                  value={formData.releaseNotes}
                  onChange={(e) => setFormData({ ...formData, releaseNotes: e.target.value })}
                />
              </div>

              <div className="form-group-app-admin">
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

              {/* Upload Status */}
              {(uploadStatus === 'uploading' || uploadStatus === 'waiting' || uploadStatus === 'success') && (
                <div className="upload-status-app-admin">
                  <div className="status-container-app-admin">
                    {uploadStatus === 'uploading' && (
                      <div className="status-content-app-admin">
                        <FaSpinner className="spinner-large-app-admin" />
                        <p className="status-text-app-admin">Uploading your APK...</p>
                      </div>
                    )}

                    {uploadStatus === 'waiting' && (
                      <div className="status-content-app-admin">
                        <FaSpinner className="spinner-large-app-admin" />
                        <p className="status-text-app-admin">Please wait for a moment...</p>
                        <p className="status-subtext-app-admin">Verifying upload completion...</p>
                      </div>
                    )}

                    {uploadStatus === 'success' && (
                      <div className="status-content-app-admin success-state-app-admin">
                        <FaCheckCircle className="success-icon-app-admin" />
                        <p className="status-text-app-admin success-text-app-admin">Upload Successful!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions-app-admin">
              <button
                className="btn-cancel-app-admin"
                onClick={handleCloseModal}
                disabled={uploading || uploadStatus === 'uploading' || uploadStatus === 'waiting'}
              >
                Cancel
              </button>
              <button
                className="btn-confirm-app-admin"
                onClick={handleSubmit}
                disabled={uploading || uploadStatus !== 'idle'}
              >
                {editingApp ? 'Update' : 'Upload'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal - portalled to body */}
      {showDeleteModal && appToDelete && createPortal(
        <div className="modal-overlay-app-admin" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content-app-admin" onClick={e => e.stopPropagation()}>
            <div className="modal-header-app-admin">
              <h3>Delete Application</h3>
              <button className="modal-close-app-admin" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body-app-admin">
              <p>
                Are you sure you want to delete version <strong>v{appToDelete.version}</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-actions-app-admin">
              <button className="btn-cancel-app-admin" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-confirm-app-admin btn-danger-app-admin" onClick={handleDelete}>
                <FaTrash /> Confirm Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notification */}
      <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
    </div>
  );
};

export default AppManagement;