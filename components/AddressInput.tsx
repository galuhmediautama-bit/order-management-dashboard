import React, { useState, useEffect, useMemo } from 'react';
import { INDONESIA_PROVINCES, INDONESIA_CITIES, INDONESIA_DISTRICTS } from '../data/indonesiaRegions';

// Types
interface Province {
  province_id: string;
  province: string;
}

interface City {
  city_id: string;
  province_id: string;
  city_name: string;
  type: string;
}

interface District {
  district_id: string;
  city_id: string;
  district_name: string;
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
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedCity, setSelectedCity] = useState(value.city || '');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState(value.district || '');
  const [detailAddress, setDetailAddress] = useState(value.detailAddress || '');
  const [postalCode, setPostalCode] = useState(value.postalCode || '');

  // Use static data
  const provinces: Province[] = INDONESIA_PROVINCES;

  // Filter cities by selected province
  const filteredCities = useMemo(() => {
    if (!selectedProvinceId) return [];
    return INDONESIA_CITIES.filter(c => c.province_id === selectedProvinceId);
  }, [selectedProvinceId]);

  // Filter districts by selected city
  const filteredDistricts = useMemo(() => {
    if (!selectedCityId) return [];
    return INDONESIA_DISTRICTS.filter(d => d.city_id === selectedCityId);
  }, [selectedCityId]);

  // Check if current province has cities in database
  const hasCitiesData = filteredCities.length > 0;
  const hasDistrictsData = filteredDistricts.length > 0;

  // Sync internal state when value prop changes (for edit mode)
  useEffect(() => {
    setSelectedProvince(value.province || '');
    setSelectedCity(value.city || '');
    setSelectedDistrict(value.district || '');
    setDetailAddress(value.detailAddress || '');
    setPostalCode(value.postalCode || '');
    
    // Find province ID
    const prov = INDONESIA_PROVINCES.find(p => p.province === value.province);
    if (prov) {
      setSelectedProvinceId(prov.province_id);
      // Find city ID
      const city = INDONESIA_CITIES.find(c => 
        c.province_id === prov.province_id && 
        `${c.type} ${c.city_name}` === value.city
      );
      if (city) {
        setSelectedCityId(city.city_id);
      }
    }
  }, [value]);

  // Handle province change
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceName = e.target.value;
    const prov = provinces.find(p => p.province === provinceName);
    setSelectedProvince(provinceName);
    setSelectedProvinceId(prov?.province_id || '');
    // Reset city and district when province changes
    setSelectedCity('');
    setSelectedCityId('');
    setSelectedDistrict('');
  };

  // Handle city change
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const cityValue = e.target.value;
    setSelectedCity(cityValue);
    
    // Find city ID if it's a select
    if (hasCitiesData) {
      const city = filteredCities.find(c => `${c.type} ${c.city_name}` === cityValue);
      setSelectedCityId(city?.city_id || '');
    }
    // Reset district when city changes
    setSelectedDistrict('');
  };

  // Handle district change
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
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

      {/* Kota/Kabupaten - Dropdown if data available, else text input */}
      {showCity && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kota/Kabupaten {requiredCity && <span className="text-red-500">*</span>}
          </label>
          {hasCitiesData ? (
            <select
              value={selectedCity}
              onChange={handleCityChange}
              disabled={disabled || !selectedProvince}
              required={requiredCity}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">{selectedProvince ? 'Pilih Kota/Kabupaten' : 'Pilih provinsi dulu'}</option>
              {filteredCities.map((city) => (
                <option key={city.city_id} value={`${city.type} ${city.city_name}`}>
                  {city.type} {city.city_name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={selectedCity}
              onChange={handleCityChange}
              disabled={disabled}
              required={requiredCity}
              placeholder="Masukkan nama kota/kabupaten"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-900"
            />
          )}
        </div>
      )}

      {/* Kecamatan - Dropdown if data available, else text input */}
      {showDistrict && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kecamatan {requiredDistrict && <span className="text-red-500">*</span>}
          </label>
          {hasDistrictsData ? (
            <select
              value={selectedDistrict}
              onChange={handleDistrictChange}
              disabled={disabled || !selectedCity}
              required={requiredDistrict}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">{selectedCity ? 'Pilih Kecamatan' : 'Pilih kota dulu'}</option>
              {filteredDistricts.map((district) => (
                <option key={district.district_id} value={district.district_name}>
                  {district.district_name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={selectedDistrict}
              onChange={handleDistrictChange}
              disabled={disabled}
              required={requiredDistrict}
              placeholder="Masukkan nama kecamatan"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-900"
            />
          )}
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
