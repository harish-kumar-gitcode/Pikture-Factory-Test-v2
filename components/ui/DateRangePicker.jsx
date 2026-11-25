'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import {
  addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, format, isSameMonth, isSameDay, isWithinInterval, isBefore,
} from 'date-fns';

function buildMonthGrid(monthDate) {
  const start = startOfWeek(startOfMonth(monthDate));
  const end = endOfWeek(endOfMonth(monthDate));
  const days = [];
  let day = start;
  while (day <= end) {
    days.push(day);
    day = addDays(day, 1);
  }
  return days;
}

/**
 * Airbnb / MakeMyTrip-style range picker: two months side by side,
 * hover-preview range, gold accent for the active range.
 */
export default function DateRangePicker({ range, onChange }) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(new Date());
  const [hoverDate, setHoverDate] = useState(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const { from, to } = range || {};

  function handlePick(day) {
    if (!from || (from && to)) {
      onChange({ from: day, to: null });
    } else if (isBefore(day, from)) {
      onChange({ from: day, to: from });
    } else {
      onChange({ from, to: day });
    }
  }

  function renderMonth(monthDate) {
    const days = buildMonthGrid(monthDate);
    const previewTo = to || hoverDate;

    return (
      <div className="w-full sm:w-[260px]">
        <div className="text-center font-semibold text-sm mb-3">{format(monthDate, 'MMMM yyyy')}</div>
        <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] text-secondary mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((day, i) => {
            const inMonth = isSameMonth(day, monthDate);
            const isFrom = from && isSameDay(day, from);
            const isTo = to && isSameDay(day, to);
            const inRange = from && previewTo && isWithinInterval(day, {
              start: isBefore(from, previewTo) ? from : previewTo,
              end: isBefore(from, previewTo) ? previewTo : from,
            });
            const isPast = isBefore(day, new Date().setHours(0, 0, 0, 0));

            return (
              <button
                key={i}
                disabled={!inMonth || isPast}
                onClick={() => handlePick(day)}
                onMouseEnter={() => setHoverDate(day)}
                className={[
                  'h-9 w-9 mx-auto text-xs rounded-full flex items-center justify-center transition-colors',
                  !inMonth || isPast ? 'text-border cursor-default' : 'text-primary hover:bg-goldsoft cursor-pointer',
                  inRange && inMonth && !isPast ? 'bg-goldsoft/60' : '',
                  (isFrom || isTo) ? '!bg-gold !text-primary font-bold' : '',
                ].join(' ')}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const label = from && to
    ? `${format(from, 'd MMM')} – ${format(to, 'd MMM yyyy')}`
    : from
    ? `${format(from, 'd MMM yyyy')} – Select end date`
    : 'Filter by event date';

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-white border border-border rounded-full px-4 py-2.5 text-sm hover:border-gold transition-colors"
      >
        <Calendar size={15} className="text-gold" />
        {label}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 bg-white rounded-pf shadow-lift border border-border p-4 sm:p-5 z-50 animate-fadeUp w-[calc(100vw-1.5rem)] sm:w-auto max-w-[560px] animate-fadeUp">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setCursor(subMonths(cursor, 1))} className="w-8 h-8 rounded-full hover:bg-bglight flex items-center justify-center">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setCursor(addMonths(cursor, 1))} className="w-8 h-8 rounded-full hover:bg-bglight flex items-center justify-center">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-6">
            {renderMonth(cursor)}
            {renderMonth(addMonths(cursor, 1))}
          </div>
          <div className="flex justify-between mt-4 pt-4 border-t border-border">
            <button
              onClick={() => onChange({ from: null, to: null })}
              className="text-xs font-semibold text-secondary hover:text-primary"
            >
              Clear dates
            </button>
            <button onClick={() => setOpen(false)} className="btn btn-primary btn-sm">Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}
