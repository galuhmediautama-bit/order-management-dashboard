
import React from 'react';

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-bold text-gray-900 dark:text-white mb-2">{`${label}`}</p>
        {payload.map((pld: any, index: number) => (
          <div key={index} style={{ color: pld.color }}>
            <span className="font-semibold">{`${pld.name}: `}</span>
            <span className="font-mono">
                {
                    pld.dataKey.toLowerCase().includes('omzet') || pld.dataKey.toLowerCase().includes('sales') || pld.dataKey.toLowerCase().includes('biaya')
                    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(pld.value)
                    : new Intl.NumberFormat('id-ID').format(pld.value)
                }
            </span>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default CustomTooltip;
