'use client';
import { Search } from 'lucide-react';

/** Reused search input + status-filter dropdown bar sitting above a data table */
export default function SearchFilter({ search, onSearch, searchPlaceholder = 'Search by name or phone...', status, onStatus, statusOptions = [] }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      <div className="flex items-center gap-2 bg-bglight border border-border rounded-full px-4 py-2.5 flex-1">
        <Search size={16} className="text-secondary" />
        <input
          className="bg-transparent outline-none text-sm flex-1"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      {statusOptions.length > 0 && (
        <select
          className="bg-white border border-border rounded-full px-4 py-2.5 text-sm min-w-[180px]"
          value={status}
          onChange={(e) => onStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
    </div>
  );
}
