import React, { useState, useEffect, useRef, useCallback } from 'react';

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

// Postal code API - using sooluh/kodepos (more complete)
const POSTAL_API_PRIMARY = 'https://kodepos.vercel.app/search';
const POSTAL_API_FALLBACK = 'https://kodepos.onrender.com/search';

export interface AddressData {
  province: string;
  city: string;
  district: string;
  village: string;
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
  showVillage?: boolean;
  showPostalCode?: boolean;
  showDetailAddress?: boolean;
  requiredProvince?: boolean;
  requiredCity?: boolean;
  requiredDistrict?: boolean;
  requiredVillage?: boolean;
  requiredPostalCode?: boolean;
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
  showPostalCode = true,
  showDetailAddress = true,
  requiredProvince = false,
  requiredCity = false,
  requiredDistrict = false,
  requiredVillage = false,
  requiredPostalCode = false,
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
  const [postalCode, setPostalCode] = useState(value.postalCode || '');

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
  const [loadingPostalCode, setLoadingPostalCode] = useState(false);

  // Track if we're syncing from external value to avoid loops
  const isSyncing = useRef(false);
  const previousValueRef = useRef<string>('');

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

    // Find and set province
    if (value.province && provinces.length > 0) {
      const normalized = value.province.toLowerCase().trim();
      const matchedProvince = provinces.find(p =>
        p.nama.toLowerCase().trim() === normalized ||
        formatName(p.nama).toLowerCase() === normalized
      );
      if (matchedProvince && matchedProvince.id !== selectedProvinceId) {
        setSelectedProvinceId(matchedProvince.id);
        return; // Let next effect handle cities
      }
    }

    // Find and set city
    if (value.city && cities.length > 0 && selectedProvinceId) {
      const normalized = value.city.toLowerCase().trim();
      const matchedCity = cities.find(c =>
        c.nama.toLowerCase().trim() === normalized ||
        formatName(c.nama).toLowerCase() === normalized
      );
      if (matchedCity && matchedCity.id !== selectedCityId) {
        setSelectedCityId(matchedCity.id);
        return; // Let next effect handle districts
      }
    }

    // Find and set district
    if (value.district && districts.length > 0 && selectedCityId) {
      const normalized = value.district.toLowerCase().trim();
      const matchedDistrict = districts.find(d =>
        d.nama.toLowerCase().trim() === normalized ||
        formatName(d.nama).toLowerCase() === normalized
      );
      if (matchedDistrict && matchedDistrict.id !== selectedDistrictId) {
        setSelectedDistrictId(matchedDistrict.id);
        return; // Let next effect handle villages
      }
    }

    // Find and set village
    if (value.village && villages.length > 0) {
      const normalized = value.village.toLowerCase().trim();
      const matchedVillage = villages.find(v =>
        v.nama.toLowerCase().trim() === normalized ||
        formatName(v.nama).toLowerCase() === normalized
      );
      if (matchedVillage && matchedVillage.id !== selectedVillageId) {
        setSelectedVillageId(matchedVillage.id);
      }
    }
  }, [value.province, value.city, value.district, value.village, provinces, cities, districts, villages, selectedProvinceId, selectedCityId, selectedDistrictId, selectedVillageId]);

  // Fetch postal code based on village
  const fetchPostalCode = useCallback(async (villageId: string) => {
    if (!villageId || !selectedVillageId) return;

    const village = villages.find(v => v.id === villageId);
    const district = districts.find(d => d.id === selectedDistrictId);
    if (!village || !district) return;

    setLoadingPostalCode(true);
    try {
      const cleanVillage = village.nama.replace(/^(desa|kelurahan)\s+/i, '').trim();
      const cleanDistrict = district.nama.replace(/^(kecamatan)\s+/i, '').trim();
      const searchQuery = encodeURIComponent(`${cleanVillage} ${cleanDistrict}`);

      let found = false;

      // Try primary API
      try {
        const res = await fetch(`${POSTAL_API_PRIMARY}/?q=${searchQuery}`);
        if (res.ok) {
          const data = await res.json();
          if (data.statusCode === 200 && data.data && data.data.length > 0) {
            const exactMatch = data.data.find((item: any) =>
              item.village?.toLowerCase() === cleanVillage.toLowerCase() &&
              item.district?.toLowerCase() === cleanDistrict.toLowerCase()
            );

            const partialMatch = data.data.find((item: any) =>
              item.village?.toLowerCase().includes(cleanVillage.toLowerCase()) ||
              cleanVillage.toLowerCase().includes(item.village?.toLowerCase() || '')
            );

            const match = exactMatch || partialMatch || data.data[0];
            if (match?.code) {
              setPostalCode(match.code.toString());
              found = true;
            }
          }
        }
      } catch (primaryErr) {
        console.log('Primary API failed, trying fallback...');
      }

      // Try fallback API if primary failed
      if (!found) {
        try {
          const fallbackRes = await fetch(`${POSTAL_API_FALLBACK}/?q=${searchQuery}`);
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            if (fallbackData.statusCode === 200 && fallbackData.data && fallbackData.data.length > 0) {
              const match = fallbackData.data[0];
              if (match?.code) {
                setPostalCode(match.code.toString());
                found = true;
              }
            }
          }
        } catch (fallbackErr) {
          console.log('Fallback API also failed');
        }
      }

      // Try with just village name if still not found
      if (!found) {
        try {
          const simpleQuery = encodeURIComponent(cleanVillage);
          const simpleRes = await fetch(`${POSTAL_API_PRIMARY}/?q=${simpleQuery}`);
          if (simpleRes.ok) {
            const simpleData = await simpleRes.json();
            if (simpleData.statusCode === 200 && simpleData.data && simpleData.data.length > 0) {
              const matchByDistrict = simpleData.data.find((item: any) =>
                item.district?.toLowerCase().includes(cleanDistrict.toLowerCase())
              );
              const match = matchByDistrict || simpleData.data[0];
              if (match?.code) {
                setPostalCode(match.code.toString());
                found = true;
              }
            }
          }
        } catch (simpleErr) {
          console.log('Simple search failed');
        }
      }
    } catch (err) {
      console.error('Error fetching postal code:', err);
    } finally {
      setLoadingPostalCode(false);
    }
  }, [villages, districts, selectedVillageId, selectedDistrictId]);

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

    // Auto-fetch postal code
    if (villId) {
      fetchPostalCode(villId);
    }
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
      selectedProvinceName,
      postalCode
    ].filter(Boolean).join(', ');

    onChange({
      province: selectedProvinceName ? formatName(selectedProvinceName) : '',
      city: selectedCityName ? formatName(selectedCityName) : '',
      district: selectedDistrictName ? formatName(selectedDistrictName) : '',
      village: selectedVillageName ? formatName(selectedVillageName) : '',
      detailAddress,
      postalCode,
      fullAddress
    });
  }, [selectedProvinceId, selectedCityId, selectedDistrictId, selectedVillageId, detailAddress, postalCode, provinces, cities, districts, villages, onChange]);

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

      {/* Alamat Lengkap - DI ATAS Kode Pos */}
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

      {/* Kode Pos - DI BAWAH Alamat Lengkap */}
      {showPostalCode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kode Pos {requiredPostalCode && <span className="text-red-500">*</span>}
            {loadingPostalCode && <span className="text-indigo-500 text-xs ml-1">(Mencari...)</span>}
          </label>
          <div className="relative">
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              disabled={disabled || loadingPostalCode}
              placeholder={loadingPostalCode ? "Mencari kode pos..." : "Masukkan kode pos"}
              maxLength={5}
              required={requiredPostalCode}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-900"
            />
            {loadingPostalCode && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
          {selectedVillageId && !postalCode && !loadingPostalCode && (
            <p className="text-xs text-gray-500 mt-1">Kode pos tidak ditemukan, silakan isi manual</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressInput;
