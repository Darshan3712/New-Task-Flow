import { useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';

/**
 * Reusable searchable checkbox multi-select dropdown.
 * Props:
 *   items         – [{ id, name }]
 *   selectedIds   – string[]
 *   onToggle      – (id) => void
 *   searchTerm    – string
 *   setSearchTerm – (val) => void
 *   isOpen        – bool
 *   setIsOpen     – (bool) => void
 *   dropdownRef   – React ref
 *   placeholder   – string  (shown when nothing selected)
 *   sm            – bool    (compact mode for inline rows)
 */
export default function MultiSelectDropdown({
  items = [],
  selectedIds = [],
  onToggle,
  searchTerm,
  setSearchTerm,
  isOpen,
  setIsOpen,
  dropdownRef,
  placeholder = 'Type to search...',
  sm = false,
}) {
  const filtered = items.filter(
    (it) => it.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    function handleOutsideClick(e) {
      if (dropdownRef?.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, dropdownRef, setIsOpen, setSearchTerm]);

  return (
    <div className="multi-select-container" ref={dropdownRef}>
      <div
        className={`dropdown-trigger searchable ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(true)}
        onMouseDown={sm ? (e) => { e.preventDefault(); setIsOpen((v) => !v); } : undefined}
        style={sm
          ? { padding: '0.1rem 0.5rem', minHeight: '32px', background: 'var(--bg)' }
          : { background: 'var(--bg)' }}
      >
        <input
          type="text"
          className={`dropdown-search-input${sm ? ' sm' : ''}`}
          placeholder={selectedIds.length === 0 ? placeholder : `${selectedIds.length} Selected`}
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onMouseDown={sm ? (e) => e.stopPropagation() : undefined}
          style={sm ? { fontSize: '0.75rem' } : undefined}
        />
        <FiChevronDown className="trigger-icon" style={sm ? { fontSize: '0.7rem' } : undefined} />
      </div>

      {isOpen && (
        <div className="dropdown-menu" onMouseDown={sm ? (e) => e.stopPropagation() : undefined}>
          {items.length === 0 ? (
            <div className="no-emp-hint">No items added yet.</div>
          ) : filtered.length === 0 ? (
            <div className="no-emp-hint">No matches found.</div>
          ) : (
            filtered.map((it) => (
              <label
                key={it.id}
                className={`emp-checkbox-item ${selectedIds.includes(it.id) ? 'checked' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(it.id)}
                  onChange={() => onToggle(it.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span
                  className="emp-check-name"
                  style={sm ? { fontSize: '0.75rem' } : undefined}
                >
                  {it.name}
                </span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
