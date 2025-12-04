import React, { useState, useEffect } from 'react';

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
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(false);

  const RAJAONGKIR_API_KEY = '936fe1a7af6d32b2a198781789b07ae7';
  const RAJAONGKIR_BASE_URL = 'https://api.rajaongkir.com/starter';

  // Sync internal state when value prop changes
  useEffect(() => {
    setSelectedProvince(value || '');
  }, [value]);

  // Fetch provinces on component mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${RAJAONGKIR_BASE_URL}/province`, {
        method: 'GET',
        headers: {
          'key': RAJAONGKIR_API_KEY
        }
      });
      const data = await response.json();
      if (data.rajaongkir && data.rajaongkir.results) {
        setProvinces(data.rajaongkir.results);
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
    } finally {
      setLoading(false);
    }
  };

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
        disabled={disabled || loading}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      >
        <option value="">
          {loading ? 'Memuat...' : 'Pilih Provinsi'}
        </option>
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
