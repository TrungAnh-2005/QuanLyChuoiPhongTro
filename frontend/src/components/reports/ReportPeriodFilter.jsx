import { Calendar } from 'lucide-react';

const ranges = [
  { id: '9_MONTHS', label: '9 Tháng Gần Nhất' },
  { id: 'Q3_2026', label: 'Quý 3/2026' },
  { id: 'Q2_2026', label: 'Quý 2/2026' },
  { id: 'SEP_2026', label: 'Tháng 09/2026' }
];
const palettes = {
  indigo: {
    icon: 'text-indigo-600',
    selected: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25',
    idle: 'text-slate-600 hover:text-indigo-700 hover:bg-slate-100',
  },
  purple: {
    icon: 'text-purple-600',
    selected: 'bg-purple-600 text-white shadow-md shadow-purple-600/25',
    idle: 'text-slate-600 hover:text-purple-700 hover:bg-slate-100',
  },
};

export default function ReportPeriodFilter({ value, onChange, color = 'indigo' }) {
  const palette = palettes[color];
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
        <Calendar className={`w-4 h-4 ${palette.icon}`} />
        <span>Khoảng thời gian báo cáo:</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {ranges.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              value === t.id
                ? palette.selected
                : palette.idle
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
