import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import './LatencyChart.css';

function fmtTick(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmtFull(dateStr) {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="lc-tooltip">
      <div className="lc-tooltip__time">{fmtFull(d.checkedAt)}</div>
      <div className={`lc-tooltip__val ${d.status === 'DOWN' ? 'lc-tooltip__val--down' : ''}`}>
        {d.status === 'DOWN' ? 'Hors ligne' : `${d.ms} ms`}
      </div>
    </div>
  );
}

// data : [{time, ms, status, checkedAt, latencyMs}] — trié chronologiquement (oldest first)
export default function LatencyChart({ data }) {
  if (!data.length) return null;

  const downEvents = data.filter((d) => d.status === 'DOWN');
  const hasUpData  = data.some((d) => d.status === 'UP' && d.ms != null);

  return (
    <div className="lc-wrap">
      {!hasUpData && downEvents.length > 0 && (
        <p className="lc-all-down">
          Tous les checks de cette période sont DOWN — aucune latence à afficher.
        </p>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={fmtTick}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            unit=" ms"
            width={62}
            allowDecimals={false}
            domain={[0, 'auto']}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="ms"
            stroke="#3b82f6"
            strokeWidth={2}
            connectNulls={false}
            dot={false}
            activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
          />
          {/* Ligne verticale rouge pour chaque événement DOWN */}
          {downEvents.map((d) => (
            <ReferenceLine
              key={d.time}
              x={d.time}
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeOpacity={0.65}
              strokeDasharray="4 2"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="lc-legend">
        <span className="lc-legend__up">— Latence (ms)</span>
        {downEvents.length > 0 && (
          <span className="lc-legend__down">- - Hors ligne</span>
        )}
      </div>
    </div>
  );
}
