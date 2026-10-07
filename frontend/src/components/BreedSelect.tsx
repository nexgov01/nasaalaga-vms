import { useEffect, useMemo, useRef, useState } from 'react';
import { breedsFor } from '../lib/breeds';

interface Props {
  species: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;       // classes applied to the inputs (so it matches each form's styling)
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

const OTHERS = 'Others';

/**
 * Searchable breed dropdown for Dog / Cat.
 * - Type to filter the list live.
 * - "Others" reveals a text box so any breed can be typed in.
 * - Species other than Dog/Cat fall back to a plain text input.
 */
export function BreedSelect({ species, value, onChange, className = '', placeholder, disabled, readOnly }: Props) {
  const list = breedsFor(species);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [othersMode, setOthersMode] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const prevSpecies = useRef(species);

  // Species changed → previous breed no longer applies
  useEffect(() => {
    if (prevSpecies.current !== species) {
      prevSpecies.current = species;
      setOthersMode(false); setQuery(''); setOpen(false);
      if (value) onChange('');
    }
  }, [species]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) { setOpen(false); setQuery(''); }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = useMemo(() => {
    if (!list) return [];
    const q = query.trim().toLowerCase();
    return q ? list.filter(b => b.toLowerCase().includes(q)) : list;
  }, [list, query]);

  const baseCls = `w-full ${className}`;

  // Not a dog/cat (or no species yet) → plain text input
  if (!list || readOnly) {
    return (
      <input
        type="text" value={value} readOnly={readOnly} disabled={disabled}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || (species ? 'Enter breed' : 'Select species first, or type breed')}
        className={baseCls}
      />
    );
  }

  const isCustom = othersMode || (!!value && value !== OTHERS && !list.includes(value));
  const shown = open ? query : isCustom ? OTHERS : value;

  const pick = (b: string) => {
    if (b === OTHERS) { setOthersMode(true); onChange(''); }
    else { setOthersMode(false); onChange(b); }
    setOpen(false); setQuery('');
  };

  const options = [...filtered, OTHERS];

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(a => Math.min(a + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && open) { e.preventDefault(); pick(options[active] ?? OTHERS); }
    else if (e.key === 'Escape') { setOpen(false); setQuery(''); }
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text" role="combobox" aria-expanded={open} autoComplete="off" disabled={disabled}
        value={shown}
        placeholder={placeholder || 'Search or select breed…'}
        onFocus={() => { setOpen(true); setActive(0); }}
        onChange={e => { setQuery(e.target.value); setOpen(true); setActive(0); }}
        onKeyDown={onKey}
        className={baseCls}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
      {open && (
        <ul className="absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg text-sm" style={{ textAlign: 'left' }}>
          {filtered.length === 0 && <li className="px-3 py-2 text-gray-400">No match — choose “Others” to type it in</li>}
          {options.map((b, i) => (
            <li
              key={b}
              onMouseDown={e => { e.preventDefault(); pick(b); }}
              onMouseEnter={() => setActive(i)}
              className={`px-3 py-2 cursor-pointer ${i === active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'} ${b === OTHERS ? 'border-t border-gray-100 font-semibold' : ''} ${b === value ? 'font-semibold' : ''}`}
            >
              {b === OTHERS ? 'Others (type breed)' : b}
            </li>
          ))}
        </ul>
      )}
      {isCustom && (
        <input
          type="text" autoFocus={othersMode && !value} value={value === OTHERS ? '' : value}
          onChange={e => onChange(e.target.value)}
          placeholder="Specify breed"
          className={`${baseCls} mt-2`}
        />
      )}
    </div>
  );
}
