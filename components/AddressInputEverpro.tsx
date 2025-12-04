import React, { useState, useEffect } from 'react';

// Types for Everpro API
interface EverproProvince {
  province_id: number;
  province_name: string;
}

interface EverproCity {
  city_id: number;
  province_id: number;
  city_name: string;
}

interface EverproDistrict {
  district_id: number;
  city_id: number;
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
  required?: boolean;
  disabled?: boolean;
}

const AddressInput: React.FC<AddressInputProps> = ({ value, onChange, required = false, disabled = false }) => {
  const [selectedProvince, setSelectedProvince] = useState(value.province || '');
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedCity, setSelectedCity] = useState(value.city || '');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState(value.district || '');
  const [detailAddress, setDetailAddress] = useState(value.detailAddress || '');
  const [postalCode, setPostalCode] = useState(value.postalCode || '');

  const [provinces, setProvinces] = useState<EverproProvince[]>([]);
  const [cities, setCities] = useState<EverproCity[]>([]);
  const [districts, setDistricts] = useState<EverproDistrict[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [authToken, setAuthToken] = useState<string>('');

  const EVERPRO_BASE_URL = 'https://client-api-sandbox.everpro.id';
  const CLIENT_KEY = '8gEcInE8tNlm8KlcNB5WMx51nj7hYM29';
  const CLIENT_SECRET = 'DLTGcnkETiqmc5s17nrYLrxSXSJW8BaD';

  // Sync internal state when value prop changes (for edit mode)
  useEffect(() => {
    setSelectedProvince(value.province || '');
    setSelectedCity(value.city || '');
    setSelectedDistrict(value.district || '');
    setDetailAddress(value.detailAddress || '');
    setPostalCode(value.postalCode || '');
  }, [value]);

  // Get auth token and fetch provinces on component mount
  useEffect(() => {
    getAuthToken();
  }, []);

  const getAuthToken = async () => {
    try {
      console.log('[AddressInput] Getting Everpro auth token...');
      const response = await fetch(`${EVERPRO_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_key: CLIENT_KEY,
          client_secret: CLIENT_SECRET
        })
      });
      const data = await response.json();
      console.log('[AddressInput] Auth response:', data);
      if (data.data && data.data.access_token) {
        const token = data.data.access_token;
        setAuthToken(token);
        // Fetch provinces after getting token
        fetchProvinces(token);
      }
    } catch (error) {
      console.error('[AddressInput] Error getting auth token:', error);
    }
  };

  const fetchProvinces = async (token: string) => {
    setLoadingProvinces(true);
    try {
      console.log('[AddressInput] Fetching provinces from Everpro...');
      const response = await fetch(`${EVERPRO_BASE_URL}/location/province`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('[AddressInput] Provinces response:', data);
      if (data.data) {
        setProvinces(data.data);
        console.log('[AddressInput] Provinces loaded:', data.data.length);
      }
    } catch (error) {
      console.error('[AddressInput] Error fetching provinces:', error);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const fetchCities = async (provinceId: string) => {
    setLoadingCities(true);
    setCities([]);
    setDistricts([]);
    try {
      console.log('[AddressInput] Fetching cities for province:', provinceId);
      const response = await fetch(`${EVERPRO_BASE_URL}/location/city?province_id=${provinceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('[AddressInput] Cities response:', data);
      if (data.data) {
        setCities(data.data);
        console.log('[AddressInput] Cities loaded:', data.data.length);
      }
    } catch (error) {
      console.error('[AddressInput] Error fetching cities:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  const fetchDistricts = async (cityId: string) => {
    setLoadingDistricts(true);
    setDistricts([]);
    try {
      console.log('[AddressInput] Fetching districts for city:', cityId);
      const response = await fetch(`${EVERPRO_BASE_URL}/location/district?city_id=${cityId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('[AddressInput] Districts response:', data);
      if (data.data) {
        setDistricts(data.data);
        console.log('[AddressInput] Districts loaded:', data.data.length);
      }
    } catch (error) {
      console.error('[AddressInput] Error fetching districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Handle province change
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = provinces.find(p => p.province_name === e.target.value);
    if (selectedOption) {
      setSelectedProvince(selectedOption.province_name);
      setSelectedProvinceId(selectedOption.province_id.toString());
      setSelectedCity('');
      setSelectedCityId('');
      setSelectedDistrict('');
      setPostalCode('');
      setCities([]);
      setDistricts([]);
      fetchCities(selectedOption.province_id.toString());
    }
  };

  // Handle city change
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = cities.find(c => c.city_name === e.target.value);
    if (selectedOption) {
      setSelectedCity(selectedOption.city_name);
      setSelectedCityId(selectedOption.city_id.toString());
      setSelectedDistrict('');
      setDistricts([]);
      fetchDistricts(selectedOption.city_id.toString());
    }
  };

  // Handle district change
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = districts.find(d => d.district_name === e.target.value);
    if (selectedOption) {
      setSelectedDistrict(selectedOption.district_name);
    }
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Provinsi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Provinsi {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={selectedProvince}
            onChange={handleProvinceChange}
            disabled={disabled || loadingProvinces}
            required={required}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">
              {loadingProvinces ? 'Memuat...' : 'Pilih Provinsi'}
            </option>
            {provinces.map((province) => (
              <option key={province.province_id} value={province.province_name}>
                {province.province_name}
              </option>
            ))}
          </select>
        </div>

        {/* Kota/Kabupaten */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kota/Kabupaten {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={selectedCity}
            onChange={handleCityChange}
            disabled={disabled || !selectedProvinceId || loadingCities}
            required={required}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-900"
          >
            <option value="">
              {loadingCities ? 'Memuat...' : selectedProvinceId ? 'Pilih Kota/Kabupaten' : 'Pilih provinsi terlebih dahulu'}
            </option>
            {cities.map((city) => (
              <option key={city.city_id} value={city.city_name}>
                {city.city_name}
              </option>
            ))}
          </select>
        </div>

        {/* Kecamatan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kecamatan {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={selectedDistrict}
            onChange={handleDistrictChange}
            disabled={disabled || !selectedCityId || loadingDistricts}
            required={required}
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

        {/* Kode Pos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kode Pos {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            disabled={disabled}
            required={required}
            placeholder="Masukkan kode pos"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Detail Alamat */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Detail Alamat (Jalan, RT/RW, No. Rumah) {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
          value={detailAddress}
          onChange={(e) => setDetailAddress(e.target.value)}
          disabled={disabled}
          required={required}
          rows={3}
          placeholder="Contoh: Jl. Sudirman No. 123, RT 01/RW 05"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>
    </div>
  );
};

export default AddressInput;
