'use client';

const STYLES = {
  success: 'text-success bg-green-100',
  warning: 'text-warning bg-amber-100',
  danger: 'text-danger bg-red-100',
  info: 'text-blue-600 bg-blue-100',
  neutral: 'text-secondary bg-bglight',
};

/** Small colored status indicator used across every table in the app */
export default function StatusPill({ tone = 'neutral', children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${STYLES[tone] || STYLES.neutral}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

/** Maps a domain status string to a StatusPill tone + label */
export function statusToneMap(status) {
  const map = {
    // enquiry tags
    new: { tone: 'info', label: 'New' },
    follow_up: { tone: 'warning', label: 'Follow-up' },
    converted: { tone: 'success', label: 'Converted' },
    lost: { tone: 'danger', label: 'Lost' },
    // client / project status
    lead: { tone: 'neutral', label: 'Lead' },
    booked: { tone: 'info', label: 'Booked' },
    vendor_assigned: { tone: 'info', label: 'Vendor Assigned' },
    shoot_scheduled: { tone: 'warning', label: 'Shoot Scheduled' },
    shoot_completed: { tone: 'warning', label: 'Shoot Completed' },
    requested: { tone: 'neutral', label: 'Requested' },
    editing: { tone: 'warning', label: 'Editing' },
    preview: { tone: 'info', label: 'Preview' },
    client_approved: { tone: 'success', label: 'Client Approved' },
    approved: { tone: 'success', label: 'Approved' },
    delivered: { tone: 'success', label: 'Delivered' },
    closed: { tone: 'neutral', label: 'Closed' },
    // vendor
    pending: { tone: 'warning', label: 'Pending' },
    rejected: { tone: 'danger', label: 'Rejected' },
    // tickets
    open: { tone: 'danger', label: 'Open' },
    in_progress: { tone: 'warning', label: 'In Progress' },
  };
  return map[status] || { tone: 'neutral', label: status };
}
