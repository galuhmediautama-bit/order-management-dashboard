import React, { useState, useEffect } from 'react';

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
  requiredProvince?: boolean;
  requiredCity?: boolean;
  requiredDistrict?: boolean;
  requiredVillage?: boolean;
}

const AddressInput: React.FC<AddressInputProps> = ({
  value,
  onChange,
  disabled = false,
  showProvince = true,
  showCity = true,
  showDistrict = true,
  showVillage = true,
  requiredProvince = false,
  requiredCity = false,
  requiredDistrict = false,
  requiredVillage = false
}) => {
  const [selectedProvince, setSelectedProvince] = useState(value.province || '');
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedCity, setSelectedCity] = useState(value.city || '');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState(value.district || '');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedVillage, setSelectedVillage] = useState(value.village || '');
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

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await fetch(`${API_BASE}/provinsi.json`);
        const data: ApiProvince[] = await res.json();
        setProvinces(data);
      } catch (err) {
        console.error('Error fetching provinces:', err);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch cities when province changes
  useEffect(() => {
    if (!selectedProvinceId) {
      setCities([]);
      return;
    }
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const res = await fetch(`${API_BASE}/kabupaten/${selectedProvinceId}.json`);
        const data: ApiCity[] = await res.json();
        setCities(data);
      } catch (err) {
        console.error('Error fetching cities:', err);
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [selectedProvinceId]);

  // Fetch districts when city changes
  useEffect(() => {
    if (!selectedCityId) {
      setDistricts([]);
      return;
    }
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const res = await fetch(`${API_BASE}/kecamatan/${selectedCityId}.json`);
        const data: ApiDistrict[] = await res.json();
        setDistricts(data);
      } catch (err) {
        console.error('Error fetching districts:', err);
        setDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [selectedCityId]);

  // Fetch villages when district changes
  useEffect(() => {
    if (!selectedDistrictId) {
      setVillages([]);
      return;
    }
    const fetchVillages = async () => {
      setLoadingVillages(true);
      try {
        const res = await fetch(`${API_BASE}/kelurahan/${selectedDistrictId}.json`);
        const data: ApiVillage[] = await res.json();
        setVillages(data);
      } catch (err) {
        console.error('Error fetching villages:', err);
        setVillages([]);
      } finally {
        setLoadingVillages(false);
      }
    };
    fetchVillages();
  }, [selectedDistrictId]);

  // Sync internal state when value prop changes (for edit mode)
  useEffect(() => {
    setSelectedProvince(value.province || '');
    setSelectedCity(value.city || '');
    setSelectedDistrict(value.district || '');
    setSelectedVillage(value.village || '');
    setDetailAddress(value.detailAddress || '');
    setPostalCode(value.postalCode || '');
  }, [value]);

  // Helper to format name (Title Case)
  const formatName = (name: string) => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Handle province change
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provId = e.target.value;
    const prov = provinces.find(p => p.id === provId);
    setSelectedProvinceId(provId);
    setSelectedProvince(prov ? formatName(prov.nama) : '');
    // Reset downstream
    setSelectedCity('');
    setSelectedCityId('');
    setSelectedDistrict('');
    setSelectedDistrictId('');
    setSelectedVillage('');
    setCities([]);
    setDistricts([]);
    setVillages([]);
  };

  // Handle city change
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityId = e.target.value;
    const city = cities.find(c => c.id === cityId);
    setSelectedCityId(cityId);
    setSelectedCity(city ? formatName(city.nama) : '');
    // Reset downstream
    setSelectedDistrict('');
    setSelectedDistrictId('');
    setSelectedVillage('');
    setDistricts([]);
    setVillages([]);
  };

  // Handle district change
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distId = e.target.value;
    const dist = districts.find(d => d.id === distId);
    setSelectedDistrictId(distId);
    setSelectedDistrict(dist ? formatName(dist.nama) : '');
    // Reset village and postal code
    setSelectedVillage('');
    setPostalCode('');
    setVillages([]);
  };

  // Fetch postal code based on village and district using multiple APIs
  const fetchPostalCode = async (villageName: string, districtName: string, cityName: string) => {
    if (!villageName || !districtName) return;
    
    setLoadingPostalCode(true);
    try {
      // Clean up names for search
      const cleanVillage = villageName.replace(/^(desa|kelurahan)\s+/i, '').trim();
      const cleanDistrict = districtName.replace(/^(kecamatan)\s+/i, '').trim();
      
      // Try primary API (sooluh/kodepos) - more complete data
      const searchQuery = encodeURIComponent(`${cleanVillage} ${cleanDistrict}`);
      
      let found = false;
      
      // Try primary API
      try {
        const res = await fetch(`${POSTAL_API_PRIMARY}/?q=${searchQuery}`);
        if (res.ok) {
          const data = await res.json();
          if (data.statusCode === 200 && data.data && data.data.length > 0) {
            // Find best match - match village and district
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
              // Try to match by district name
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
          console.log('Simple search also failed');
        }
      }
      
      // Try with district + city if still not found
      if (!found && cityName) {
        try {
          const cityQuery = encodeURIComponent(`${cleanDistrict} ${cityName}`);
          const cityRes = await fetch(`${POSTAL_API_PRIMARY}/?q=${cityQuery}`);
          if (cityRes.ok) {
            const cityData = await cityRes.json();
            if (cityData.statusCode === 200 && cityData.data && cityData.data.length > 0) {
              setPostalCode(cityData.data[0].code?.toString() || '');
            }
          }
        } catch (cityErr) {
          console.log('City search also failed');
        }
      }
    } catch (err) {
      console.error('Error fetching postal code:', err);
    } finally {
      setLoadingPostalCode(false);
    }
  };

  // Handle village change
  const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const villId = e.target.value;
    const vill = villages.find(v => v.id === villId);
    const villageName = vill ? formatName(vill.nama) : '';
    setSelectedVillage(villageName);
    
    // Auto-fetch postal code
    if (villageName && selectedDistrict) {
      fetchPostalCode(villageName, selectedDistrict, selectedCity);
    }
  };

  // Handle postal code change
  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPostalCode(e.target.value);
  };

  // Update parent component when any field changes
  useEffect(() => {
    const fullAddress = [
      detailAddress,
      selectedVillage,
      selectedDistrict,
      selectedCity,
      selectedProvince,
      postalCode
    ].filter(Boolean).join(', ');

    onChange({
      province: selectedProvince,
      city: selectedCity,
      district: selectedDistrict,
      village: selectedVillage,
      detailAddress,
      postalCode,
      fullAddress
    });
  }, [selectedProvince, selectedCity, selectedDistrict, selectedVillage, detailAddress, postalCode]);

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
            value={villages.find(v => formatName(v.nama) === selectedVillage)?.id || ''}
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

      {/* Kode Pos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Kode Pos {loadingPostalCode && <span className="text-indigo-500 text-xs ml-1">(Mencari...)</span>}
        </label>
        <div className="relative">
          <input
            type="text"
            value={postalCode}
            onChange={handlePostalCodeChange}
            disabled={disabled || loadingPostalCode}
            placeholder={loadingPostalCode ? "Mencari kode pos..." : "Masukkan kode pos"}
            maxLength={5}
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
        {selectedVillage && !postalCode && !loadingPostalCode && (
          <p className="text-xs text-gray-500 mt-1">Kode pos tidak ditemukan, silakan isi manual</p>
        )}
      </div>
    </div>
  );
};

export default AddressInput;
