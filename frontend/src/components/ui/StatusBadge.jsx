import { STATUS_CONFIG } from '../../utils';

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.todo;
  return (
    <span className={`badge ${config.color}`}>{config.label}</span>
  );
}
