import { PRIORITY_CONFIG } from '../../utils';

export default function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span className={`badge ${config.color}`}>{config.label}</span>
  );
}
