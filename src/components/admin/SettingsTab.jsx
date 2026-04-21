export default function SettingsTab({ systemSettings, updateSystemSettings }) {
  const toggle = (key, value) => updateSystemSettings({ ...systemSettings, [key]: value });

  const ToggleRow = ({ settingKey, label, description }) => {
    const isYes = systemSettings?.[settingKey] !== false;
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.2rem' }}>{label}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{description}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={async () => await toggle(settingKey, true)}
            style={{ padding: '0.4rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid ' + (isYes ? 'var(--accent)' : 'var(--border)'), background: isYes ? 'var(--accent)' : 'var(--bg)', color: isYes ? '#fff' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >Yes</button>
          <button
            onClick={async () => await toggle(settingKey, false)}
            style={{ padding: '0.4rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid ' + (!isYes ? 'var(--red)' : 'var(--border)'), background: !isYes ? 'rgba(239,68,68,0.1)' : 'var(--bg)', color: !isYes ? 'var(--red)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >No</button>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-section">
      <div className="admin-form-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h3>Global System Settings</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Use these settings to restrict what standard Admins are allowed to do. Changes are saved automatically.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <ToggleRow
            settingKey="adminCanManageEmployees"
            label="Admins can manage Employees"
            description='If disabled, the "Employees" tab is completely hidden from standard Admins.'
          />
          <ToggleRow
            settingKey="adminCanComment"
            label="Admins can comment with Clients"
            description="If disabled, standard Admins will not see the comment input box in client requests."
          />
          <ToggleRow
            settingKey="employeeCanComment"
            label="Employees can comment with Clients"
            description="If disabled, no Employee will be able to comment, regardless of individual settings."
          />
        </div>
      </div>
    </div>
  );
}
