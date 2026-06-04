import React from 'react';
import './ConfirmModal.css';

export default function ConfirmModal({ title, message, onConfirm, onCancel, confirmText = "Confirm", confirmColor = "#e0245e" }) {
  // Prevent clicks from propagating if nested
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div className="confirm-modal-overlay" onClick={handleOverlayClick}>
      <div className="confirm-modal-card">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-modal-actions">
          <button className="confirm-cancel-btn" onClick={onCancel}>Cancel</button>
          <button 
            className="confirm-action-btn" 
            onClick={onConfirm}
            style={{ backgroundColor: confirmColor }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
