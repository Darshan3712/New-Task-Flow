// Same content — no context imports needed, purely presentational
export default function LogoutConfirmModal({ onCancel, onConfirm }) {
  return (
    <div className="popup-overlay" onClick={onCancel}>
      <div
        className="popup-card"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '360px', textAlign: 'center', padding: '1.5rem' }}
      >
        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>Confirm Logout</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Are you sure you want to log out?
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={{ padding: '0.5rem 1.5rem', borderRadius: '6px', background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontWeight: 600, flex: 1 }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: '0.5rem 1.5rem', borderRadius: '6px', background: '#e11d48', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, flex: 1 }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
