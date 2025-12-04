import React, { useState, useEffect } from 'react';

// Types for Raja Ongkir API
interface Province {
  province_id: string;
  province: string;
}

interface City {
  city_id: string;
  province_id: string;
  type: string;
  city_name: string;
  postal_code: string;
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

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const RAJAONGKIR_API_KEY = '936fe1a7af6d32b2a198781789b07ae7';
  const RAJAONGKIR_BASE_URL = 'https://api.rajaongkir.com/starter';

  // Sync internal state when value prop changes (for edit mode)
  useEffect(() => {
    setSelectedProvince(value.province || '');
    setSelectedCity(value.city || '');
    setSelectedDistrict(value.district || '');
    setDetailAddress(value.detailAddress || '');
    setPostalCode(value.postalCode || '');
  }, [value]);

  // Fetch provinces on component mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    const startTime = Date.now();
    console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] 🔄 Mulai fetching provinces...`);
    setLoadingProvinces(true);
    try {
      console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] 📡 Calling API: ${RAJAONGKIR_BASE_URL}/province`);
      const response = await fetch(`${RAJAONGKIR_BASE_URL}/province`, {
        method: 'GET',
        headers: {
          'key': RAJAONGKIR_API_KEY
        }
      });
      const elapsed = Date.now() - startTime;
      console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] ✅ Response received in ${elapsed}ms`);
      
      const data = await response.json();
      console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] 📦 Response status:`, response.status);
      
      if (data.rajaongkir && data.rajaongkir.results) {
        setProvinces(data.rajaongkir.results);
        console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] ✅ Provinces loaded successfully: ${data.rajaongkir.results.length} items`);
      } else {
        console.warn(`[${new Date().toLocaleTimeString()}] [AddressInput] ⚠️ Unexpected response format:`, data);
      }
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`[${new Date().toLocaleTimeString()}] [AddressInput] ❌ Error fetching provinces after ${elapsed}ms:`, error);
    } finally {
      setLoadingProvinces(false);
      console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] 🏁 Provinces fetch completed`);
    }
  };

  const fetchCities = async (provinceId: string) => {
    const startTime = Date.now();
    console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] 🔄 Mulai fetching cities untuk province: ${provinceId}`);
    setLoadingCities(true);
    try {
      const url = `${RAJAONGKIR_BASE_URL}/city?province=${provinceId}`;
      console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] 📡 Calling API: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'key': RAJAONGKIR_API_KEY
        }
      });
      const elapsed = Date.now() - startTime;
      console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] ✅ Response received in ${elapsed}ms`);
      
      const data = await response.json();
      console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] 📦 Response status:`, response.status);
      
      if (data.rajaongkir && data.rajaongkir.results) {
        setCities(data.rajaongkir.results);
        console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] ✅ Cities loaded successfully: ${data.rajaongkir.results.length} items`);
      } else {
        console.warn(`[${new Date().toLocaleTimeString()}] [AddressInput] ⚠️ Unexpected response format:`, data);
      }
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`[${new Date().toLocaleTimeString()}] [AddressInput] ❌ Error fetching cities after ${elapsed}ms:`, error);
    } finally {
      setLoadingCities(false);
      console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] 🏁 Cities fetch completed`);
    }
  };

  // Fetch districts from Raja Ongkir
  const fetchDistricts = async (cityId: string) => {
    const startTime = Date.now();
    console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] 🔄 Mulai fetching districts untuk city: ${cityId}`);
    setLoadingDistricts(true);
    try {
      const url = `${RAJAONGKIR_BASE_URL}/subdistrict?city=${cityId}`;
      console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] 📡 Calling API: ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'key': RAJAONGKIR_API_KEY
        }
      });
      const elapsed = Date.now() - startTime;
      console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] ✅ Response received in ${elapsed}ms`);
      
      const data = await response.json();
      console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] 📦 Response status:`, response.status);
      
      if (data.rajaongkir && data.rajaongkir.results) {
        setDistricts(data.rajaongkir.results);
        console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] ✅ Districts loaded successfully: ${data.rajaongkir.results.length} items`);
      } else {
        console.warn(`[${new Date().toLocaleTimeString()}] [AddressInput] ⚠️ Unexpected response format:`, data);
      }
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`[${new Date().toLocaleTimeString()}] [AddressInput] ❌ Error fetching districts after ${elapsed}ms:`, error);
    } finally {
      setLoadingDistricts(false);
      console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] 🏁 Districts fetch completed`);
    }
  };

  // Handle province change
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] 👤 User memilih provinsi:`, e.target.value);
    const selectedOption = provinces.find(p => p.province === e.target.value);
    if (selectedOption) {
      console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] ✅ Provinsi ditemukan, ID: ${selectedOption.province_id}`);
      setSelectedProvince(selectedOption.province);
      setSelectedProvinceId(selectedOption.province_id);
      setSelectedCity('');
      setSelectedCityId('');
      setSelectedDistrict('');
      setPostalCode('');
      setCities([]);
      setDistricts([]);
      fetchCities(selectedOption.province_id);
    }
  };

  // Handle city change
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] 👤 User memilih kota:`, e.target.value);
    const selectedOption = cities.find(c => `${c.type} ${c.city_name}` === e.target.value);
    if (selectedOption) {
      console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] ✅ Kota ditemukan, ID: ${selectedOption.city_id}, Kode Pos: ${selectedOption.postal_code}`);
      setSelectedCity(`${selectedOption.type} ${selectedOption.city_name}`);
      setSelectedCityId(selectedOption.city_id);
      setSelectedDistrict('');
      setPostalCode(selectedOption.postal_code);
      setDistricts([]);
      fetchDistricts(selectedOption.city_id);
    }
  };

  // Handle district change
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(`[${new Date().toLocaleTimeString()}] [AddressInput] 👤 User memilih kecamatan:`, e.target.value);
    setSelectedDistrict(e.target.value);
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
            disabled={disabled || loadingProvinces}
            required={requiredProvince}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">
              {loadingProvinces ? 'Memuat...' : 'Pilih Provinsi'}
            </option>
            {provinces.map((province) => (
              <option key={province.province_id} value={province.province}>
                {province.province}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Kota/Kabupaten */}
      {showCity && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kota/Kabupaten {requiredCity && <span className="text-red-500">*</span>}
          </label>
          <select
            value={selectedCity}
            onChange={handleCityChange}
            disabled={disabled || !selectedProvinceId || loadingCities}
            required={requiredCity}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-900"
          >
            <option value="">
              {loadingCities ? 'Memuat...' : selectedProvinceId ? 'Pilih Kota/Kabupaten' : 'Pilih provinsi terlebih dahulu'}
            </option>
            {cities.map((city) => (
              <option key={city.city_id} value={`${city.type} ${city.city_name}`}>
                {city.type} {city.city_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Kecamatan */}
      {showDistrict && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kecamatan {requiredDistrict && <span className="text-red-500">*</span>}
          </label>
          <select
            value={selectedDistrict}
            onChange={handleDistrictChange}
            disabled={disabled || !selectedCityId || loadingDistricts}
            required={requiredDistrict}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-900"
          >
            <option value="">
              {loadingDistricts ? 'Memuat...' : selectedCityId ? 'Pilih Kecamatan' : 'Pilih kota terlebih dahulu'}
            </option>
            {districts.map((district) => (
              <option key={district.district_id} value={district.district_name}>
                {district.district_name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default AddressInput;
