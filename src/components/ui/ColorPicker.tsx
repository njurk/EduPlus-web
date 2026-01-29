const COLORS = [
    '#ef4444', 
    '#f97316', 
    '#eab308', 
    '#22c55e', 
    '#14b8a6', 
    '#3b82f6', 
    '#8b5cf6', 
    '#ec4899', 
    '#6b7280'
];

export const ColorPicker = ({ value, onChange, label }: { value: string; onChange: (c: string) => void; label?: string }) => (
    <div>
        {label && <label className="label-text">{label}</label>}
        <div className="flex gap-2 flex-wrap mt-1">
            {COLORS.map(c => (
                <button key={c} type="button" onClick={() => onChange(c)} title={c}
                    className={`w-8 h-8 rounded border-2 ${value === c ? 'border-neutral-800 scale-110' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                />
            ))}
        </div>
    </div>
);
