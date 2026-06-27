import './PingBadge.css';

const MAP = {
  UP:   { label: 'En ligne',       cls: 'pb--up'      },
  DOWN: { label: 'Hors ligne',     cls: 'pb--down'    },
};

export default function PingBadge({ status }) {
  const { label, cls } = MAP[status] ?? { label: 'Jamais vérifié', cls: 'pb--unknown' };
  return (
    <span className={`pb-badge ${cls}`}>
      <span className="pb-dot" />
      {label}
    </span>
  );
}
