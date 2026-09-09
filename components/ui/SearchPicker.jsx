'use client';
import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

/**
 * A type-to-search dropdown for picking one record out of a large list — used wherever a plain
 * <select> would force the admin to scroll through hundreds of vendors/clients.
 *
 * Props:
 *  - fetchResults(query) -> Promise<array>   called (debounced) as the admin types
 *  - renderLabel(item)   -> string           main line shown in the results list
 *  - renderSub(item)     -> string           secondary line shown in the results list (code, phone, etc.)
 *  - onSelect(item|null)                     called with the picked item, or null when cleared
 *  - selected                                the currently selected item (or null)
 *  - placeholder
 */
export default function SearchPicker({ fetchResults, renderLabel, renderSub, onSelect, selected, placeholder = 'Search...' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const items = await fetchResults(query);
      setResults(items || []);
      setLoading(false);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query, open]);

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 bg-bglight border border-border rounded-full px-4 py-2.5">
        <div className="min-w-0">
          <b className="text-sm block truncate">{renderLabel(selected)}</b>
          {renderSub && <span className="text-xs text-secondary block truncate">{renderSub(selected)}</span>}
        </div>
        <button type="button" onClick={() => { onSelect(null); setQuery(''); }} className="shrink-0 text-secondary hover:text-danger">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapRef}>
      <div className="flex items-center gap-2 bg-bglight border border-border rounded-full px-4 py-2.5">
        <Search size={16} className="text-secondary shrink-0" />
        <input
          className="bg-transparent outline-none text-sm flex-1 min-w-0"
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        />
      </div>
      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white border border-border rounded-xl shadow-lift max-h-64 overflow-y-auto">
          {loading && <p className="text-xs text-secondary text-center py-4">Searching...</p>}
          {!loading && results.length === 0 && <p className="text-xs text-secondary text-center py-4">No matches.</p>}
          {!loading && results.map((item) => (
            <button
              type="button"
              key={item._id}
              onClick={() => { onSelect(item); setOpen(false); setQuery(''); }}
              className="w-full text-left px-4 py-2.5 hover:bg-bglight border-b border-border last:border-0"
            >
              <b className="text-sm block truncate">{renderLabel(item)}</b>
              {renderSub && <span className="text-xs text-secondary block truncate">{renderSub(item)}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
