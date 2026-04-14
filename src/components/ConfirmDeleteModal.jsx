import React from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, itemName = "this item" }) {
  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="popup-card confirm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
        <button className="popup-close" onClick={onClose}><FiX size={20} /></button>
        <FiAlertTriangle size={48} color="#e74c3c" style={{ marginBottom: '1rem' }} />
        <h3 style={{ marginBottom: '0.5rem', marginTop: 0 }}>Are You Sure?</h3>
        <p style={{ color: 'var(--text-light, #7f8c8d)', marginBottom: '2rem' }}>
          Do you really want to delete {itemName}? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <button 
            onClick={onClose} 
            style={{ 
              flex: 1, 
              padding: '0.75rem', 
              background: 'var(--bg, #fff)', 
              color: 'var(--text, #333)', 
              border: '1px solid var(--border, #ccc)', 
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500
            }}>
            Cancel
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            style={{ 
              flex: 1, 
              padding: '0.75rem', 
              background: '#e74c3c', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500
            }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
