import React, { useState, useEffect } from 'react';
import { INDONESIA_PROVINCES } from '../data/indonesiaRegions';

interface Province {
  province_id: string;
  province: string;
}

interface ProvinceInputProps {
  value: string;
  onChange: (province: string) => void;
  required?: boolean;
  disabled?: boolean;
}

const ProvinceInput: React.FC<ProvinceInputProps> = ({ value, onChange, required = false, disabled = false }) => {
  const [selectedProvince, setSelectedProvince] = useState(value || '');
  
  // Use static provinces data
  const provinces: Province[] = INDONESIA_PROVINCES;

  // Sync internal state when value prop changes
  useEffect(() => {
    setSelectedProvince(value || '');
  }, [value]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setSelectedProvince(newValue);
    onChange(newValue);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Provinsi {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={selectedProvince}
        onChange={handleProvinceChange}
        disabled={disabled}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      >
        <option value="">Pilih Provinsi</option>
        {provinces.map((province) => (
          <option key={province.province_id} value={province.province}>
            {province.province}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ProvinceInput;
