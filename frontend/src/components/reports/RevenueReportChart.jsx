import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const palettes = {
  indigo: { text: 'text-indigo-700', swatch: 'bg-indigo-600', fill: '#4f46e5' },
  purple: { text: 'text-purple-700', swatch: 'bg-purple-600', fill: '#7c3aed' },
};

export default function RevenueReportChart({ data, title, description, revenueLabel, comparisonLabel, color = 'indigo' }) {
  const palette = palettes[color];
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs card-interactive">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {title} (Triệu VNĐ)
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold">
          <span className={`flex items-center gap-1.5 ${palette.text}`}>
            <span className={`w-3 h-3 rounded ${palette.swatch}`}></span>
            <span>{revenueLabel}</span>
          </span>
          <span className="flex items-center gap-1.5 text-blue-600">
            <span className="w-3 h-3 rounded bg-blue-600"></span>
            <span>{comparisonLabel}</span>
          </span>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}Tr`} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#cbd5e1',
                borderRadius: '0.75rem',
                color: '#0f172a',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(val, name) => [`${val} Triệu VNĐ`, name]}
            />
            <Bar
              dataKey="revenue"
              fill={palette.fill}
              radius={[6, 6, 0, 0]}
              name={revenueLabel}
            />
            <Bar
              dataKey="profit"
              fill="#2563eb"
              radius={[6, 6, 0, 0]}
              name={comparisonLabel}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
