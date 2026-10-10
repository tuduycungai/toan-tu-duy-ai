import { useState, useRef } from 'react';
import { type ChartData } from '../lib/curriculum';
import { validateTable, chartScale } from '../public/statistics.mjs';
import { downloadBlob } from '../lib/diagram-export';
const colors = ['#17836b', '#ec9852', '#6276ce', '#b9689b', '#6f9954', '#867365'];
export function StatisticsLab({
  initial,
  onConfirm,
}: {
  initial?: ChartData;
  onConfirm: (data: string) => void;
}) {
  const [text, setText] = useState(
    initial
      ? initial.labels
          .map(
            (s, i) => `${s};${initial.values[i]}${initial.second ? ';' + initial.second[i] : ''}`,
          )
          .join('\n')
      : '',
  );
  const [unit, setUnit] = useState(initial?.unit || ''),
    [label, setLabel] = useState(initial?.label || 'Nhóm');
  const [positions, setPositions] = useState(initial?.positions?.join(';') || '');
  const [equalIntervals, setEqualIntervals] = useState(false),
    [percent, setPercent] = useState(initial?.percent || false);
  const [confirmed, setConfirmed] = useState<ChartData | null>(null),
    [kind, setKind] = useState('bar'),
    [error, setError] = useState('');
  const svg = useRef<SVGSVGElement>(null);
  function confirm() {
    try {
      const rows = text
          .trim()
          .split(/\n/)
          .map((r) => r.split(';').map((s) => s.trim())),
        double = rows.some((r) => r.length === 3);
      if (rows.some((r) => r.length !== (double ? 3 : 2) || r.some((s) => s === '')))
        throw Error('Mỗi dòng: Tên nhóm;Giá trị (hoặc thêm ;Giá trị thứ hai), không để trống.');
      const numbers = positions.trim()
        ? positions.split(';').map((s) => (s.trim() ? Number(s.replace(',', '.')) : NaN))
        : rows.every((r) => /^[-+]?\d+(\.\d+)?$/.test(r[0]))
          ? rows.map((r) => Number(r[0]))
          : undefined;
      const data = validateTable({
        labels: rows.map((r) => r[0]),
        values: rows.map((r) => Number(r[1].replace(',', '.'))),
        ...(double
          ? {
              second: rows.map((r) => Number(r[2].replace(',', '.'))),
              series: initial?.series || ['Dãy 1', 'Dãy 2'],
            }
          : {}),
        ...(numbers ? { positions: numbers } : {}),
        unit,
        label,
        percent,
      });
      setConfirmed(data);
      setKind('bar');
      setError('');
      onConfirm(
        `${label} — đơn vị: ${unit}\n` +
          data.labels
            .map(
              (name, i) => `${name}: ${data.values[i]}${data.second ? ' / ' + data.second[i] : ''}`,
            )
            .join('\n') +
          (data.positions ? '\nMốc ngang: ' + data.positions.join('; ') : ''),
      );
    } catch (e) {
      setConfirmed(null);
      setError((e as Error).message);
    }
  }
  const d = confirmed ? validateTable(confirmed) : null,
    scale = d ? chartScale(d) : { min: 0, max: 1, ticks: [0, 1] };
  const width = Math.max(600, (d?.labels.length || 0) * 65 + 140),
    height = kind === 'pie' ? Math.max(405, 110 + (d?.labels.length || 0) * 24) : 430;
  const w = width - 140,
    x = (i: number) =>
      kind === 'line' && d?.positions
        ? 85 +
          ((d.positions[i] - d.positions[0]) / (d.positions.at(-1)! - d.positions[0])) * (w - 30)
        : 70 + (i + 0.5) * (w / Math.max(1, d?.labels.length || 1));
  const y = (v: number) => 300 - ((v - scale.min) / (scale.max - scale.min)) * 230,
    zero = y(0);
  const lineAllowed = !!d?.positions || equalIntervals;
  let angle = -Math.PI / 2;
  return (
    <section className="statistics-lab">
      <h3>Bảng dữ liệu & biểu đồ</h3>
      <p className="caption">
        Đối chiếu và xác nhận dữ liệu trước khi vẽ. Mỗi dòng: Tên nhóm;Giá trị. Thêm cột thứ hai để
        vẽ cột kép.
      </p>
      <label>
        Dữ liệu
        <textarea
          aria-label="Dữ liệu"
          value={text}
          rows={4}
          onChange={(e) => {
            setText(e.target.value);
            setConfirmed(null);
          }}
          placeholder={'A;10\nB;15\nC;5'}
        />
      </label>
      <div className="chart-inputs">
        <label>
          Trục ngang
          <input
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              setConfirmed(null);
            }}
          />
        </label>
        <label>
          Đơn vị
          <input
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value);
              setConfirmed(null);
            }}
          />
        </label>
      </div>
      <label>
        Mốc ngang dạng số, nếu có (ví dụ: 2020;2022;2025)
        <input
          value={positions}
          onChange={(e) => {
            setPositions(e.target.value);
            setConfirmed(null);
          }}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={percent}
          onChange={(e) => {
            setPercent(e.target.checked);
            setConfirmed(null);
          }}
        />{' '}
        Dữ liệu phần trăm của một tổng
      </label>
      <button className="primary" onClick={confirm}>
        Xác nhận dữ liệu và vẽ
      </button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {d && (
        <>
          <div className="chart-inputs">
            <label>
              Loại biểu đồ
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="bar">{d.second ? 'Cột kép' : 'Cột'}</option>
                <option value="line">Đoạn thẳng</option>
                {!d.second && d.angles.length > 0 && <option value="pie">Quạt tròn</option>}
              </select>
            </label>
            <button
              disabled={kind === 'line' && !lineAllowed}
              onClick={() => {
                if (svg.current)
                  downloadBlob(
                    new Blob([new XMLSerializer().serializeToString(svg.current)], {
                      type: 'image/svg+xml',
                    }),
                    'bieu-do.svg',
                  );
              }}
            >
              Tải SVG
            </button>
          </div>
          {kind === 'line' && !d.positions && (
            <label>
              <input
                type="checkbox"
                checked={equalIntervals}
                onChange={(e) => setEqualIntervals(e.target.checked)}
              />{' '}
              Em xác nhận các mốc ngang có thứ tự và cách đều.
            </label>
          )}
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{d.label}</th>
                  <th>
                    {d.series?.[0] || 'Giá trị'} ({d.unit})
                  </th>
                  {d.second && (
                    <th>
                      {d.series?.[1]} ({d.unit})
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {d.labels.map((s, i) => (
                  <tr key={s}>
                    <th>{s}</th>
                    <td>{d.values[i]}</td>
                    {d.second && <td>{d.second[i]}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {kind === 'line' && !lineAllowed ? (
            <p role="status">
              Hãy nhập các mốc ngang dạng số hoặc xác nhận khoảng cách đều trước khi vẽ đoạn thẳng.
            </p>
          ) : (
            <div className="chart-scroll">
              <svg
                ref={svg}
                xmlns="http://www.w3.org/2000/svg"
                viewBox={`0 0 ${width} ${height}`}
                style={{ minWidth: Math.max(420, width * 0.75) }}
                role="img"
                aria-label={`Biểu đồ ${kind}; đơn vị ${d.unit}`}
              >
                <rect width={width} height={height} fill="#fff" />
                {kind === 'pie' ? (
                  <>
                    {d.values.map((v, i) => {
                      const start = angle;
                      angle += (v / d.total) * 2 * Math.PI;
                      if (!v) return null;
                      const a = [190 + 100 * Math.cos(start), 190 + 100 * Math.sin(start)],
                        b = [190 + 100 * Math.cos(angle), 190 + 100 * Math.sin(angle)];
                      return v === d.total ? (
                        <circle key={i} cx="190" cy="190" r="100" fill={colors[i % 6]} />
                      ) : (
                        <path
                          key={i}
                          d={`M190 190 L${a[0]} ${a[1]} A100 100 0 ${v / d.total > 0.5 ? 1 : 0} 1 ${b[0]} ${b[1]} Z`}
                          fill={colors[i % 6]}
                          stroke="white"
                        />
                      );
                    })}
                    {d.labels.map((s, i) => (
                      <text key={s} x="315" y={75 + i * 24} fill={colors[i % 6]} fontSize="12">
                        {s.length > 22 ? s.slice(0, 21) + '…' : s}: {d.values[i]} {d.unit}
                      </text>
                    ))}
                  </>
                ) : (
                  <>
                    {scale.ticks.map((v) => (
                      <g key={v}>
                        <line
                          x1="70"
                          x2={width - 70}
                          y1={y(v)}
                          y2={y(v)}
                          stroke={v === 0 ? '#73817e' : '#ddd'}
                        />
                        <text x="62" y={y(v) + 4} textAnchor="end" fontSize="12" fill="#293b39">
                          {v}
                        </text>
                      </g>
                    ))}
                    <text x="70" y="35" fontSize="14" fill="#293b39">
                      {d.unit}
                    </text>
                    {[d.values, ...(d.second ? [d.second] : [])].map((vals, j) => (
                      <g key={j}>
                        {kind === 'line' ? (
                          <polyline
                            points={vals.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
                            fill="none"
                            stroke={colors[j]}
                            strokeWidth="3"
                          />
                        ) : null}
                        {vals.map((v, i) =>
                          kind === 'line' ? (
                            <g key={i}>
                              <circle cx={x(i)} cy={y(v)} r="4" fill={colors[j]} />
                              <title>
                                {d.labels[i]}: {v} {d.unit}
                              </title>
                            </g>
                          ) : (
                            <rect
                              key={i}
                              x={
                                x(i) -
                                Math.min(28, (w / d.labels.length) * 0.32) +
                                (d.second ? j * Math.min(28, (w / d.labels.length) * 0.32) : 0)
                              }
                              y={Math.min(y(v), zero)}
                              width={Math.min(28, (w / d.labels.length) * 0.32)}
                              height={Math.abs(zero - y(v))}
                              fill={colors[j]}
                            >
                              <title>
                                {d.labels[i]}: {v} {d.unit}
                              </title>
                            </rect>
                          ),
                        )}
                      </g>
                    ))}
                    {d.labels.map((s, i) => (
                      <text
                        key={s}
                        x={x(i)}
                        y="323"
                        textAnchor="end"
                        transform={`rotate(-35 ${x(i)} 323)`}
                        fontSize="11"
                        fill="#293b39"
                      >
                        <title>{s}</title>
                        {s.length > 18 ? s.slice(0, 17) + '…' : s}
                      </text>
                    ))}
                    <text x={width / 2} y="408" textAnchor="middle" fontSize="14" fill="#293b39">
                      {d.label}
                    </text>
                    {d.second &&
                      d.series?.map((s, i) => (
                        <text
                          x={width - 300 + i * 120}
                          y="35"
                          key={s}
                          fill={colors[i]}
                          fontSize="13"
                        >
                          ■ {s}
                        </text>
                      ))}
                  </>
                )}
              </svg>
            </div>
          )}
          <p className="caption">
            {kind === 'pie'
              ? 'Các góc quạt được tính theo tỉ lệ của tổng.'
              : kind === 'line'
                ? 'Khoảng cách ngang theo mốc số hoặc các khoảng đều đã xác nhận.'
                : 'Trục dọc có mốc 0 và các khoảng chia đều.'}{' '}
            Biểu đồ thể hiện dữ liệu đã xác nhận, chưa thay cho nhận xét của em. Tên đầy đủ nằm
            trong bảng.
          </p>
        </>
      )}
    </section>
  );
}
