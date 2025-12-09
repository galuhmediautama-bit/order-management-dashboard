import React, { useState, useEffect } from 'react';
import { INDONESIA_PROVINCES } from '../data/indonesiaRegions';

// Types
interface Province {
  province_id: string;
  province: string;
}

export interface AddressData {
  province: string;
  city: string;
  district: string;
  detailAddress: string;
  postalCode: string;
  fullAddress: string;
}

interface AddressInputProps {
  value: AddressData;
  onChange: (data: AddressData) => void;
  disabled?: boolean;
  showProvince?: boolean;
  showCity?: boolean;
  showDistrict?: boolean;
  requiredProvince?: boolean;
  requiredCity?: boolean;
  requiredDistrict?: boolean;
}

const AddressInput: React.FC<AddressInputProps> = ({ 
  value, 
  onChange, 
  disabled = false, 
  showProvince = true, 
  showCity = true, 
  showDistrict = true,
  requiredProvince = false,
  requiredCity = false,
  requiredDistrict = false
}) => {
  const [selectedProvince, setSelectedProvince] = useState(value.province || '');
  const [selectedCity, setSelectedCity] = useState(value.city || '');
  const [selectedDistrict, setSelectedDistrict] = useState(value.district || '');
  const [detailAddress, setDetailAddress] = useState(value.detailAddress || '');
  const [postalCode, setPostalCode] = useState(value.postalCode || '');

  // Use static provinces data
  const provinces: Province[] = INDONESIA_PROVINCES;

  // Sync internal state when value prop changes (for edit mode)
  useEffect(() => {
    setSelectedProvince(value.province || '');
    setSelectedCity(value.city || '');
    setSelectedDistrict(value.district || '');
    setDetailAddress(value.detailAddress || '');
    setPostalCode(value.postalCode || '');
  }, [value]);

  // Handle province change
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceName = e.target.value;
    setSelectedProvince(provinceName);
    // Reset city and district when province changes
    setSelectedCity('');
    setSelectedDistrict('');
  };

  // Handle city change (text input)
  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedCity(e.target.value);
  };

  // Handle district change (text input)
  const handleDistrictChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDistrict(e.target.value);
  };

  // Handle postal code change
  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPostalCode(e.target.value);
  };

  // Update parent component when any field changes
  useEffect(() => {
    const fullAddress = [
      detailAddress,
      selectedDistrict,
      selectedCity,
      selectedProvince,
      postalCode
    ].filter(Boolean).join(', ');

    onChange({
      province: selectedProvince,
      city: selectedCity,
      district: selectedDistrict,
      detailAddress,
      postalCode,
      fullAddress
    });
  }, [selectedProvince, selectedCity, selectedDistrict, detailAddress, postalCode]);

  return (
    <div className="space-y-4">
      {/* Provinsi */}
      {showProvince && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Provinsi {requiredProvince && <span className="text-red-500">*</span>}
          </label>
          <select
            value={selectedProvince}
            onChange={handleProvinceChange}
            disabled={disabled}
            required={requiredProvince}
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
      )}

      {/* Kota/Kabupaten - Text Input */}
      {showCity && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kota/Kabupaten {requiredCity && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={selectedCity}
            onChange={handleCityChange}
            disabled={disabled}
            required={requiredCity}
            placeholder="Masukkan nama kota/kabupaten"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-900"
          />
        </div>
      )}

      {/* Kecamatan - Text Input */}
      {showDistrict && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kecamatan {requiredDistrict && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={selectedDistrict}
            onChange={handleDistrictChange}
            disabled={disabled}
            required={requiredDistrict}
            placeholder="Masukkan nama kecamatan"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-900"
          />
        </div>
      )}

      {/* Kode Pos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Kode Pos
        </label>
        <input
          type="text"
          value={postalCode}
          onChange={handlePostalCodeChange}
          disabled={disabled}
          placeholder="Masukkan kode pos"
          maxLength={5}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-900"
        />
      </div>
    </div>
  );
};

export default AddressInput;
