import React, { useState, useEffect, useRef } from 'react';

// API Base URL for Indonesia regions data
const API_BASE = 'https://ibnux.github.io/data-indonesia';

// Types from API
interface ApiProvince {
  id: string;
  nama: string;
}

interface ApiCity {
  id: string;
  nama: string;
}

interface ApiDistrict {
  id: string;
  nama: string;
}

interface ApiVillage {
  id: string;
  nama: string;
}

export interface AddressData {
  province: string;
  city: string;
  district: string;
  village: string;
  detailAddress: string;
  fullAddress: string;
}

interface AddressInputProps {
  value: AddressData;
  onChange: (data: AddressData) => void;
  disabled?: boolean;
  showProvince?: boolean;
  showCity?: boolean;
  showDistrict?: boolean;
  showVillage?: boolean;
  showDetailAddress?: boolean;
  requiredProvince?: boolean;
  requiredCity?: boolean;
  requiredDistrict?: boolean;
  requiredVillage?: boolean;
  requiredDetailAddress?: boolean;
  required?: boolean; // Legacy prop for backward compatibility
  addressError?: string; // Error message for address field
}

const AddressInput: React.FC<AddressInputProps> = ({
  value,
  onChange,
  disabled = false,
  showProvince = true,
  showCity = true,
  showDistrict = true,
  showVillage = true,
  showDetailAddress = true,
  requiredProvince = false,
  requiredCity = false,
  requiredDistrict = false,
  requiredVillage = false,
  requiredDetailAddress = false,
  required = false, // Legacy - if true, makes detailAddress required
  addressError // Error message for address field
}) => {
  // Local state - use IDs only for dropdown values
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const [detailAddress, setDetailAddress] = useState(value.detailAddress || '');

  // Data states
  const [provinces, setProvinces] = useState<ApiProvince[]>([]);
  const [cities, setCities] = useState<ApiCity[]>([]);
  const [districts, setDistricts] = useState<ApiDistrict[]>([]);
  const [villages, setVillages] = useState<ApiVillage[]>([]);

  // Loading states
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Track if we're syncing from external value to avoid loops
  const isSyncing = useRef(false);
  const previousValueRef = useRef<string>('');

  // Sync detailAddress from prop when it changes
  useEffect(() => {
    if (value.detailAddress !== detailAddress) {
      setDetailAddress(value.detailAddress);
    }
  }, [value.detailAddress]);

  // Helper to sort data A-Z by nama
  const sortByName = <T extends { nama: string }>(data: T[]): T[] => {
    return [...data].sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
  };

  // Helper to format name (Title Case)
  const formatName = (name: string) => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Normalize names to improve matching against API values (handles Kota/Kab./Kec. prefixes)
  const normalizeName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[.]/g, '')
      .replace(/^(kota administrasi|kota adm|kota|kabupaten|kab|kec|kecamatan|kelurahan|desa)\s+/, '')
      .trim();
  };

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await fetch(`${API_BASE}/provinsi.json`);
        if (!res.ok) throw new Error('Failed to fetch provinces');
        const data: ApiProvince[] = await res.json();
        setProvinces(sortByName(data));
      } catch (err) {
        console.error('Error fetching provinces:', err);
        setProvinces([]);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch cities when province ID changes
  useEffect(() => {
    if (!selectedProvinceId) {
      setCities([]);
      setSelectedCityId('');
      setSelectedDistrictId('');
      setSelectedVillageId('');
      setDistricts([]);
      setVillages([]);
      return;
    }

    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const res = await fetch(`${API_BASE}/kabupaten/${selectedProvinceId}.json`);
        const data: ApiCity[] = await res.json();
        setCities(sortByName(data));
      } catch (err) {
        console.error('Error fetching cities:', err);
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [selectedProvinceId]);

  // Fetch districts when city ID changes
  useEffect(() => {
    if (!selectedCityId) {
      setDistricts([]);
      setSelectedDistrictId('');
      setSelectedVillageId('');
      setVillages([]);
      return;
    }

    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const res = await fetch(`${API_BASE}/kecamatan/${selectedCityId}.json`);
        const data: ApiDistrict[] = await res.json();
        setDistricts(sortByName(data));
      } catch (err) {
        console.error('Error fetching districts:', err);
        setDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [selectedCityId]);

  // Fetch villages when district ID changes
  useEffect(() => {
    if (!selectedDistrictId) {
      setVillages([]);
      setSelectedVillageId('');
      return;
    }

    const fetchVillages = async () => {
      setLoadingVillages(true);
      try {
        const res = await fetch(`${API_BASE}/kelurahan/${selectedDistrictId}.json`);
        const data: ApiVillage[] = await res.json();
        setVillages(sortByName(data));
      } catch (err) {
        console.error('Error fetching villages:', err);
        setVillages([]);
      } finally {
        setLoadingVillages(false);
      }
    };
    fetchVillages();
  }, [selectedDistrictId]);

  // Sync external value prop to local state (for edit mode)
  useEffect(() => {
    const currentValueStr = JSON.stringify({
      province: value.province,
      city: value.city,
      district: value.district,
      village: value.village,
    });

    // If value hasn't changed, skip sync
    if (currentValueStr === previousValueRef.current) {
      return;
    }

    previousValueRef.current = currentValueStr;

    if (isSyncing.current) {
      isSyncing.current = false;
      return;
    }

    // Only match if provinces loaded
    if (!provinces.length) return;

    // Find and set province
    if (value.province) {
      const normalized = normalizeName(value.province);
      const matchedProvince = provinces.find(p =>
        normalizeName(p.nama) === normalized ||
        formatName(p.nama).toLowerCase() === value.province.toLowerCase().trim()
      );
      if (matchedProvince && matchedProvince.id !== selectedProvinceId) {
        setSelectedProvinceId(matchedProvince.id);
        return; // Let next effect handle cities
      }
    }

    // Find and set city
    if (value.city && cities.length > 0 && selectedProvinceId) {
      const normalized = normalizeName(value.city);
      const matchedCity = cities.find(c =>
        normalizeName(c.nama) === normalized ||
        formatName(c.nama).toLowerCase() === value.city.toLowerCase().trim()
      );
      if (matchedCity && matchedCity.id !== selectedCityId) {
        setSelectedCityId(matchedCity.id);
        return; // Let next effect handle districts
      }
    }

    // Find and set district
    if (value.district && districts.length > 0 && selectedCityId) {
      const normalized = normalizeName(value.district);
      const matchedDistrict = districts.find(d =>
        normalizeName(d.nama) === normalized ||
        formatName(d.nama).toLowerCase() === value.district.toLowerCase().trim()
      );
      if (matchedDistrict && matchedDistrict.id !== selectedDistrictId) {
        setSelectedDistrictId(matchedDistrict.id);
        return; // Let next effect handle villages
      }
    }

    // Find and set village
    if (value.village && villages.length > 0 && selectedDistrictId) {
      const normalized = normalizeName(value.village);
      const matchedVillage = villages.find(v =>
        normalizeName(v.nama) === normalized ||
        formatName(v.nama).toLowerCase() === value.village.toLowerCase().trim()
      );
      if (matchedVillage && matchedVillage.id !== selectedVillageId) {
        setSelectedVillageId(matchedVillage.id);
      }
    }
  }, [value.province, value.city, value.district, value.village, provinces, cities, districts, villages, selectedProvinceId, selectedCityId, selectedDistrictId, selectedVillageId]);

  // Handle province change
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provId = e.target.value;
    isSyncing.current = true;
    setSelectedProvinceId(provId);
  };

  // Handle city change
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityId = e.target.value;
    isSyncing.current = true;
    setSelectedCityId(cityId);
  };

  // Handle district change
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distId = e.target.value;
    isSyncing.current = true;
    setSelectedDistrictId(distId);
  };

  // Handle village change
  const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const villId = e.target.value;
    isSyncing.current = true;
    setSelectedVillageId(villId);
  };

  // Update parent when local state changes
  useEffect(() => {
    if (isSyncing.current) {
      isSyncing.current = false;
      return;
    }

    const selectedProvinceName = provinces.find(p => p.id === selectedProvinceId)?.nama || '';
    const selectedCityName = cities.find(c => c.id === selectedCityId)?.nama || '';
    const selectedDistrictName = districts.find(d => d.id === selectedDistrictId)?.nama || '';
    const selectedVillageName = villages.find(v => v.id === selectedVillageId)?.nama || '';

    const fullAddress = [
      detailAddress,
      selectedVillageName,
      selectedDistrictName,
      selectedCityName,
      selectedProvinceName
    ].filter(Boolean).join(', ');

    onChange({
      province: selectedProvinceName ? formatName(selectedProvinceName) : '',
      city: selectedCityName ? formatName(selectedCityName) : '',
      district: selectedDistrictName ? formatName(selectedDistrictName) : '',
      village: selectedVillageName ? formatName(selectedVillageName) : '',
      detailAddress,
      fullAddress
    });
  }, [selectedProvinceId, selectedCityId, selectedDistrictId, selectedVillageId, detailAddress, provinces, cities, districts, villages, onChange]);

  return (
    <div className="space-y-4">
      {/* Provinsi */}
      {showProvince && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Provinsi {requiredProvince && <span className="text-red-500">*</span>}
          </label>
          <select
            value={selectedProvinceId}
            onChange={handleProvinceChange}
            disabled={disabled || loadingProvinces}
            required={requiredProvince}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">{loadingProvinces ? 'Memuat...' : 'Pilih Provinsi'}</option>
            {provinces.map((province) => (
              <option key={province.id} value={province.id}>
                {formatName(province.nama)}
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
            value={selectedCityId}
            onChange={handleCityChange}
            disabled={disabled || !selectedProvinceId || loadingCities}
            required={requiredCity}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">
              {loadingCities ? 'Memuat...' : selectedProvinceId ? 'Pilih Kota/Kabupaten' : 'Pilih provinsi dulu'}
            </option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {formatName(city.nama)}
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
            value={selectedDistrictId}
            onChange={handleDistrictChange}
            disabled={disabled || !selectedCityId || loadingDistricts}
            required={requiredDistrict}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">
              {loadingDistricts ? 'Memuat...' : selectedCityId ? 'Pilih Kecamatan' : 'Pilih kota dulu'}
            </option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {formatName(district.nama)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Kelurahan/Desa */}
      {showVillage && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kelurahan/Desa {requiredVillage && <span className="text-red-500">*</span>}
          </label>
          <select
            value={selectedVillageId}
            onChange={handleVillageChange}
            disabled={disabled || !selectedDistrictId || loadingVillages}
            required={requiredVillage}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">
              {loadingVillages ? 'Memuat...' : selectedDistrictId ? 'Pilih Kelurahan/Desa' : 'Pilih kecamatan dulu'}
            </option>
            {villages.map((village) => (
              <option key={village.id} value={village.id}>
                {formatName(village.nama)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Alamat Lengkap */}
      {showDetailAddress && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Alamat Lengkap {(requiredDetailAddress || required) && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={detailAddress}
            onChange={(e) => setDetailAddress(e.target.value)}
            disabled={disabled}
            placeholder="Nama jalan, nomor rumah, RT/RW, patokan, dll"
            rows={3}
            required={requiredDetailAddress || required}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-900 resize-none ${addressError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {addressError && (
            <p className="text-xs text-red-500 mt-1">{addressError}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressInput;
