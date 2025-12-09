// Data Provinsi Indonesia
export interface Province {
    province_id: string;
    province: string;
}

export interface City {
    city_id: string;
    province_id: string;
    city_name: string;
    type: string;
}

export interface District {
    district_id: string;
    city_id: string;
    district_name: string;
}

export const INDONESIA_PROVINCES: Province[] = [
    { province_id: '1', province: 'Bali' },
    { province_id: '2', province: 'Bangka Belitung' },
    { province_id: '3', province: 'Banten' },
    { province_id: '4', province: 'Bengkulu' },
    { province_id: '5', province: 'DI Yogyakarta' },
    { province_id: '6', province: 'DKI Jakarta' },
    { province_id: '7', province: 'Gorontalo' },
    { province_id: '8', province: 'Jambi' },
    { province_id: '9', province: 'Jawa Barat' },
    { province_id: '10', province: 'Jawa Tengah' },
    { province_id: '11', province: 'Jawa Timur' },
    { province_id: '12', province: 'Kalimantan Barat' },
    { province_id: '13', province: 'Kalimantan Selatan' },
    { province_id: '14', province: 'Kalimantan Tengah' },
    { province_id: '15', province: 'Kalimantan Timur' },
    { province_id: '16', province: 'Kalimantan Utara' },
    { province_id: '17', province: 'Kepulauan Riau' },
    { province_id: '18', province: 'Lampung' },
    { province_id: '19', province: 'Maluku' },
    { province_id: '20', province: 'Maluku Utara' },
    { province_id: '21', province: 'Nanggroe Aceh Darussalam' },
    { province_id: '22', province: 'Nusa Tenggara Barat' },
    { province_id: '23', province: 'Nusa Tenggara Timur' },
    { province_id: '24', province: 'Papua' },
    { province_id: '25', province: 'Papua Barat' },
    { province_id: '26', province: 'Papua Barat Daya' },
    { province_id: '27', province: 'Papua Pegunungan' },
    { province_id: '28', province: 'Papua Selatan' },
    { province_id: '29', province: 'Papua Tengah' },
    { province_id: '30', province: 'Riau' },
    { province_id: '31', province: 'Sulawesi Barat' },
    { province_id: '32', province: 'Sulawesi Selatan' },
    { province_id: '33', province: 'Sulawesi Tengah' },
    { province_id: '34', province: 'Sulawesi Tenggara' },
    { province_id: '35', province: 'Sulawesi Utara' },
    { province_id: '36', province: 'Sumatera Barat' },
    { province_id: '37', province: 'Sumatera Selatan' },
    { province_id: '38', province: 'Sumatera Utara' },
];

// Kota/Kabupaten - Hanya Bali untuk sekarang
export const INDONESIA_CITIES: City[] = [
    // Bali
    { city_id: '1', province_id: '1', city_name: 'Denpasar', type: 'Kota' },
    { city_id: '2', province_id: '1', city_name: 'Badung', type: 'Kabupaten' },
    { city_id: '3', province_id: '1', city_name: 'Bangli', type: 'Kabupaten' },
    { city_id: '4', province_id: '1', city_name: 'Buleleng', type: 'Kabupaten' },
    { city_id: '5', province_id: '1', city_name: 'Gianyar', type: 'Kabupaten' },
    { city_id: '6', province_id: '1', city_name: 'Jembrana', type: 'Kabupaten' },
    { city_id: '7', province_id: '1', city_name: 'Karangasem', type: 'Kabupaten' },
    { city_id: '8', province_id: '1', city_name: 'Klungkung', type: 'Kabupaten' },
    { city_id: '9', province_id: '1', city_name: 'Tabanan', type: 'Kabupaten' },
];

// Kecamatan - Hanya Bali untuk sekarang
export const INDONESIA_DISTRICTS: District[] = [
    // Kota Denpasar
    { district_id: '1', city_id: '1', district_name: 'Denpasar Barat' },
    { district_id: '2', city_id: '1', district_name: 'Denpasar Selatan' },
    { district_id: '3', city_id: '1', district_name: 'Denpasar Timur' },
    { district_id: '4', city_id: '1', district_name: 'Denpasar Utara' },
    // Kabupaten Badung
    { district_id: '5', city_id: '2', district_name: 'Kuta' },
    { district_id: '6', city_id: '2', district_name: 'Kuta Selatan' },
    { district_id: '7', city_id: '2', district_name: 'Kuta Utara' },
    { district_id: '8', city_id: '2', district_name: 'Mengwi' },
    { district_id: '9', city_id: '2', district_name: 'Abiansemal' },
    { district_id: '10', city_id: '2', district_name: 'Petang' },
    // Kabupaten Gianyar
    { district_id: '11', city_id: '5', district_name: 'Gianyar' },
    { district_id: '12', city_id: '5', district_name: 'Ubud' },
    { district_id: '13', city_id: '5', district_name: 'Tegallalang' },
    { district_id: '14', city_id: '5', district_name: 'Sukawati' },
    { district_id: '15', city_id: '5', district_name: 'Blahbatuh' },
    { district_id: '16', city_id: '5', district_name: 'Tampaksiring' },
    { district_id: '17', city_id: '5', district_name: 'Payangan' },
    // Kabupaten Tabanan
    { district_id: '18', city_id: '9', district_name: 'Tabanan' },
    { district_id: '19', city_id: '9', district_name: 'Kediri' },
    { district_id: '20', city_id: '9', district_name: 'Kerambitan' },
    { district_id: '21', city_id: '9', district_name: 'Penebel' },
    { district_id: '22', city_id: '9', district_name: 'Selemadeg' },
];
