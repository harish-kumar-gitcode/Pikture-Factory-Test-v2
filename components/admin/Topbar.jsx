'use client';
import { Bell } from 'lucide-react';

export default function AdminTopbar({ title, subtitle, hasNotification = false }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl md:text-[26px]">{title}</h1>
        {subtitle && <p className="text-sm text-secondary mt-0.5">{subtitle}</p>}
      </div>
      <button className="w-[42px] h-[42px] rounded-full bg-white border border-border flex items-center justify-center relative hover:bg-primary hover:text-white transition-colors">
        <Bell size={17} />
        {hasNotification && <span className="absolute top-2 right-2.5 w-2 h-2 bg-danger rounded-full border-2 border-white" />}
      </button>
    </div>
  );
}
