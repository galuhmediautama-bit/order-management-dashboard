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
  const isLocalChange = useRef(false);

  // Sync detailAddress from prop when it changes EXTERNALLY (not from user typing)
  useEffect(() => {
    // Skip if this is a local change (user typing)
    if (isLocalChange.current) {
      isLocalChange.current = false;
      return;
    }
    // Only sync if the external value is different from current local state
    if (value.detailAddress !== undefined && value.detailAddress !== detailAddress) {
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
          
          {/* Smart Address Guidance - Real-time checklist */}
          {(() => {
            const text = detailAddress.toLowerCase();
            
            // Detect address components with comprehensive patterns
            // Jalan/Dusun: JL, JL., JLN, JALAN, GANG, GG, GG., DUSUN, DSN, DSN., DS, BLOK, PERUMAHAN, PERUM, KOMPLEK, KOMP, CLUSTER, GRIYA, TAMAN, RUKO
            const hasStreetName = /(?:jl\.?|jln\.?|jalan|gang|gg\.?|dusun|dsn\.?|ds\.?|blok|perumahan|perum\.?|komp\.?|komplek|cluster|griya|taman|ruko)/i.test(detailAddress);
            
            // Nomor: NO, NO., NOMOR, NOMER, NMR + any number
            const hasNumber = /(?:no\.?\s*\d|nomor|nomer|nmr\.?)/i.test(detailAddress) || /\d+/.test(detailAddress);
            
            // RT/RW: RT, RT., RT/RW, RW, RW.
            const hasRtRw = /(?:rt\.?\s*\d|rw\.?\s*\d|rt\s*\/\s*rw|rt\s*\d+\s*\/?\s*rw)/i.test(detailAddress);
            
            // Kelurahan/Desa: KEL, KEL., KELURAHAN, DESA, DSA, DS., KAMPUNG, KP, KP.
            const hasKelDesa = /(?:kel\.?|kelurahan|desa|dsa|ds\.?|kampung|kp\.?)/i.test(detailAddress);
            
            // Kecamatan: KEC, KEC., KECAMATAN, KCMTN, CAMAT
            const hasKecamatan = /(?:kec\.?|kecamatan|kcmtn|camat)/i.test(detailAddress);
            
            // Kota/Kabupaten: KOTA, KOT., KAB, KAB., KABUPATEN
            const hasKotaKab = /(?:kota|kot\.?|kab\.?|kabupaten)/i.test(detailAddress);
            
            // Provinsi: PROV, PROV., PROVINSI, PROPINSI
            const hasProvinsi = /(?:prov\.?|provinsi|propinsi)/i.test(detailAddress);
            
            // Kode Pos: 5 digit number
            const hasKodePos = /\b\d{5}\b/.test(detailAddress);
            
            // Patokan: PATOKAN, DEKAT, DEPAN, SAMPING, BELAKANG, SEBERANG, SEBELAH
            const hasPatokan = /(?:patokan|dekat|depan|samping|belakang|seberang|sebelah|di\s+depan|di\s+samping|di\s+belakang)/i.test(detailAddress);
            
            // Required: 6 items, Optional bonus: 3 items
            const requiredCount = [hasStreetName, hasNumber, hasRtRw, hasKelDesa, hasKecamatan, hasKotaKab].filter(Boolean).length;
            const bonusCount = [hasProvinsi, hasKodePos, hasPatokan].filter(Boolean).length;
            const totalCount = requiredCount + bonusCount;
            const isComplete = requiredCount >= 6;
            const isPerfect = isComplete && bonusCount >= 2;
            const isPartial = requiredCount > 0 && requiredCount < 6;

            // Generate suggestions for required (6 items now)
            const suggestions: string[] = [];
            if (!hasStreetName) suggestions.push('Nama Jalan/Gang/Dusun');
            if (!hasNumber) suggestions.push('Nomor Rumah');
            if (!hasRtRw) suggestions.push('RT/RW');
            if (!hasKelDesa) suggestions.push('Kel/Desa');
            if (!hasKecamatan) suggestions.push('Kecamatan');
            if (!hasKotaKab) suggestions.push('Kota/Kab');
            
            // Generate bonus suggestions (3 items)
            const bonusSuggestions: string[] = [];
            if (!hasProvinsi) bonusSuggestions.push('Provinsi');
            if (!hasKodePos) bonusSuggestions.push('Kode Pos');
            if (!hasPatokan) bonusSuggestions.push('Patokan');
            
            return (
              <div className={`mb-2 p-3 rounded-lg border ${
                isPerfect
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                  : isComplete 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : isPartial
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              }`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold flex items-center gap-1.5">
                    {isPerfect ? (
                      <>
                        <span className="text-emerald-500">🏆</span>
                        <span className="text-emerald-700 dark:text-emerald-300">Alamat Super Lengkap!</span>
                      </>
                    ) : isComplete ? (
                      <>
                        <span className="text-green-500">✅</span>
                        <span className="text-green-700 dark:text-green-300">Alamat Lengkap!</span>
                      </>
                    ) : (
                      <>
                        <span className="text-amber-500">📝</span>
                        <span className="text-amber-700 dark:text-amber-300">Panduan Pengisian Alamat</span>
                      </>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isComplete 
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                        : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                    }`}>
                      {requiredCount}/6 Wajib
                    </span>
                    {isComplete && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        bonusCount >= 2
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                          : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      }`}>
                        +{bonusCount} Bonus
                      </span>
                    )}
                  </div>
                </div>

                {/* Checklist - Required (6 items) */}
                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Wajib Diisi:</div>
                <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs mb-2">
                  <div className={`flex items-center gap-1 ${hasStreetName ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span>{hasStreetName ? '✓' : '○'}</span>
                    <span className="truncate">Jalan/Dusun</span>
                    {!hasStreetName && <span className="text-red-500">*</span>}
                  </div>
                  <div className={`flex items-center gap-1 ${hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span>{hasNumber ? '✓' : '○'}</span>
                    <span className="truncate">No. Rumah</span>
                    {!hasNumber && <span className="text-red-500">*</span>}
                  </div>
                  <div className={`flex items-center gap-1 ${hasRtRw ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span>{hasRtRw ? '✓' : '○'}</span>
                    <span className="truncate">RT/RW</span>
                    {!hasRtRw && <span className="text-red-500">*</span>}
                  </div>
                  <div className={`flex items-center gap-1 ${hasKelDesa ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span>{hasKelDesa ? '✓' : '○'}</span>
                    <span className="truncate">Kel/Desa</span>
                    {!hasKelDesa && <span className="text-red-500">*</span>}
                  </div>
                  <div className={`flex items-center gap-1 ${hasKecamatan ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span>{hasKecamatan ? '✓' : '○'}</span>
                    <span className="truncate">Kecamatan</span>
                    {!hasKecamatan && <span className="text-red-500">*</span>}
                  </div>
                  <div className={`flex items-center gap-1 ${hasKotaKab ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span>{hasKotaKab ? '✓' : '○'}</span>
                    <span className="truncate">Kota/Kab</span>
                    {!hasKotaKab && <span className="text-red-500">*</span>}
                  </div>
                </div>

                {/* Checklist - Bonus/Optional (3 items) */}
                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Opsional (Bonus):</div>
                <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs mb-2">
                  <div className={`flex items-center gap-1 ${hasProvinsi ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    <span>{hasProvinsi ? '✓' : '○'}</span>
                    <span className="truncate">Provinsi</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasKodePos ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    <span>{hasKodePos ? '✓' : '○'}</span>
                    <span className="truncate">Kode Pos</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasPatokan ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    <span>{hasPatokan ? '✓' : '○'}</span>
                    <span className="truncate">Patokan</span>
                  </div>
                </div>

                {/* Suggestion for required */}
                {!isComplete && suggestions.length > 0 && (
                  <div className="pt-2 border-t border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      <span className="font-semibold">⚠️ Wajib:</span>{' '}
                      {suggestions.join(', ')}
                    </p>
                  </div>
                )}

                {/* Suggestion for bonus when required is complete */}
                {isComplete && bonusSuggestions.length > 0 && bonusCount < 2 && (
                  <div className="pt-2 border-t border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-700 dark:text-green-300">
                      <span className="font-semibold">💡 Lebih lengkap:</span>{' '}
                      Tambahkan {bonusSuggestions.slice(0, 2).join(', ')} untuk alamat super lengkap
                    </p>
                  </div>
                )}

                {/* Example when empty */}
                {!detailAddress && (
                  <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-600 dark:text-blue-400 italic">
                      Contoh: JL. Merdeka No. 12, RT 02/RW 03, Kel. Sukamaju, Kec. Cileungsi, Kab. Bogor
                    </p>
                  </div>
                )}

                {/* Success message */}
                {isPerfect && (
                  <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      🏆 Alamat super lengkap! Kurir pasti mudah menemukan lokasi Anda.
                    </p>
                  </div>
                )}
                {isComplete && !isPerfect && (
                  <div className="pt-2 border-t border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-600 dark:text-green-400">
                      ✨ Alamat sudah memenuhi syarat minimal. Tambahkan info bonus untuk hasil terbaik!
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          <textarea
            value={detailAddress}
            onChange={(e) => {
              isLocalChange.current = true;
              setDetailAddress(e.target.value);
            }}
            disabled={disabled}
            placeholder="Contoh: JL. Merdeka No. 12, RT 02/RW 03, Kel. Sukamaju, Kec. Cileungsi, Kab. Bogor"
            rows={3}
            maxLength={500}
            required={requiredDetailAddress || required}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-900 resize-none ${addressError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{detailAddress.length}/500</div>
          {addressError && (
            <p className="text-xs text-red-500 mt-1">{addressError}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressInput;
