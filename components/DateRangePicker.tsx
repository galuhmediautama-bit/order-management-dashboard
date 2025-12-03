
import React, { useState, useRef, useEffect } from 'react';
import CalendarIcon from './icons/CalendarIcon';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS = [
    { label: 'Hari ini', days: 0 },
    { label: 'Kemarin', days: 1, isYesterday: true },
    { label: '7 hari terakhir', days: 6 },
    { label: '30 hari terakhir', days: 29 },
    { label: '3 bulan terakhir', months: 3 },
    { label: '6 bulan terakhir', months: 6 },
];

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];


const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(value.endDate || new Date());
    const pickerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatDate = (date: Date | null) => {
        if (!date) return '';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    
    const handlePresetClick = (preset: typeof PRESETS[0]) => {
        const endDate = new Date();
        const startDate = new Date();
        if (preset.isYesterday) {
            startDate.setDate(endDate.getDate() - 1);
            endDate.setDate(endDate.getDate() - 1);
        } else if(preset.days !== undefined) {
            startDate.setDate(endDate.getDate() - preset.days);
        } else if (preset.months) {
            startDate.setMonth(endDate.getMonth() - preset.months);
        }
        onChange({ startDate, endDate });
        setIsOpen(false);
    };

    const handleDateClick = (day: Date) => {
        if (!value.startDate || (value.startDate && value.endDate)) {
            onChange({ startDate: day, endDate: null });
        } else if (day < value.startDate) {
            onChange({ startDate: day, endDate: value.startDate });
        } else {
            onChange({ ...value, endDate: day });
        }
    };
    
    const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const nextYear = () => setViewDate(d => new Date(d.getFullYear() + 1, d.getMonth(), 1));
    const prevYear = () => setViewDate(d => new Date(d.getFullYear() - 1, d.getMonth(), 1));

    const Calendar = ({ date }: { date: Date }) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Monday is 0
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
        const blanks = Array(adjustedFirstDay).fill(null);
        const cells = [...blanks, ...days];

        const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
        
        return (
            <div className="w-64">
                <div className="flex justify-between items-center mb-2">
                     <span className="font-semibold">{date.getFullYear()}-{String(month + 1).padStart(2, '0')}</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400">
                    {DAY_NAMES.map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 mt-2">
                    {cells.map((day, i) => {
                        if (!day) return <div key={`blank-${i}`}></div>;
                        const isStart = value.startDate && isSameDay(day, value.startDate);
                        const isEnd = value.endDate && isSameDay(day, value.endDate);
                        const inRange = value.startDate && value.endDate && day > value.startDate && day < value.endDate;
                        
                        const baseClasses = "w-8 h-8 flex items-center justify-center rounded-full text-sm";
                        let dayClasses = "hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer";

                        if(isStart || isEnd) dayClasses += " bg-indigo-600 text-white";
                        else if(inRange) dayClasses += " bg-indigo-100 dark:bg-indigo-900 rounded-none";
                        if (isStart && value.endDate) dayClasses += " rounded-r-none";
                        if (isEnd) dayClasses += " rounded-l-none";

                        return (
                           <div key={day.toISOString()} className={`flex justify-center items-center ${inRange ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''} ${isStart && value.endDate ? 'rounded-l-full' : ''} ${isEnd ? 'rounded-r-full' : ''} `}>
                             <button onClick={() => handleDateClick(day)} className={`${baseClasses} ${dayClasses}`}>
                                {day.getDate()}
                            </button>
                           </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const nextViewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);

    return (
        <div className="relative" ref={pickerRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium w-full md:w-auto">
                <CalendarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span>{formatDate(value.startDate)} - {formatDate(value.endDate)}</span>
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-2xl z-50 flex p-4">
                    <div className="flex flex-col pr-4 border-r dark:border-gray-700 space-y-1">
                        {PRESETS.map(p => (
                            <button key={p.label} onClick={() => handlePresetClick(p)} className="px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md w-36">
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <div className="pl-4">
                         <div className="flex justify-between items-center mb-2 px-2">
                            <div className="flex items-center gap-2">
                                <button onClick={prevYear} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full">{'«'}</button>
                                <button onClick={prevMonth} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full">{'<'}</button>
                            </div>
                             <div className="flex items-center gap-2">
                                <button onClick={nextMonth} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full">{'>'}</button>
                                <button onClick={nextYear} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full">{'»'}</button>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Calendar date={viewDate} />
                            <Calendar date={nextViewDate} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangePicker;
