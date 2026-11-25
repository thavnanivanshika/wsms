// Maps a request status to a badge CSS modifier + readable label.
const MAP = {
  SUBMITTED: ['badge-pending', 'Awaiting approval'],
  APPROVED: ['badge-ok', 'Approved'],
  REJECTED: ['badge-no', 'Rejected'],
  WITHDRAWN: ['badge-muted', 'Withdrawn'],
  CANCEL_REQUESTED: ['badge-pending', 'Cancellation requested'],
  CANCELLED: ['badge-muted', 'Cancelled'],
};

export default function StatusBadge({ status }) {
  const [cls, label] = MAP[status] || ['badge-muted', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}
