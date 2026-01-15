import { useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface UptimeCounterProps {
    initialSeconds: number;
}

export const UptimeCounter = ({ initialSeconds }: UptimeCounterProps) => {
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        let s = initialSeconds;
        const format = () => {
            const d = Math.floor(s / 86400);
            const h = Math.floor((s % 86400) / 3600).toString().padStart(2, '0');
            const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
            const sec = (s % 60).toString().padStart(2, '0');
            return d > 0 ? `${d}d ${h}:${m}:${sec}` : `${h}:${m}:${sec}`;
        };
        if (ref.current) ref.current.textContent = format();
        const timer = setInterval(() => { s++; if (ref.current) ref.current.textContent = format(); }, 1000);
        return () => clearInterval(timer);
    }, [initialSeconds]);

    return (
        <div className="flex items-center gap-2 text-xs text-neutral-500 bg-neutral-100 px-3 py-1.5 rounded-xs">
            <Clock size={14} />
            <span>Server uptime: <span ref={ref} /></span>
        </div>
    );
};
