export const ALL_30_ODISHA_DISTRICTS = [
  'Khordha (Bhubaneswar)',
  'Cuttack',
  'Ganjam (Berhampur)',
  'Balasore (Baleswar)',
  'Sambalpur',
  'Puri',
  'Mayurbhanj (Baripada)',
  'Bhadrak',
  'Sundargarh (Rourkela)',
  'Angul',
  'Bargarh',
  'Jharsuguda',
  'Kalahandi (Bhawanipatna)',
  'Koraput',
  'Kendujhar (Keonjhar)',
  'Jajpur',
  'Jagatsinghpur',
  'Kendrapara',
  'Dhenkanal',
  'Nayagarh',
  'Nabarangpur',
  'Nuapada',
  'Rayagada',
  'Gajapati (Paralakhemundi)',
  'Kandhamal (Phulbani)',
  'Boudh',
  'Subarnapur (Sonepur)',
  'Deogarh',
  'Malkangiri',
  'Bolangir (Balangir)'
];

const STORAGE_KEY_DISTRICT = 'oep_user_district';
const STORAGE_KEY_NAME = 'oep_user_name';

/** Get live user district selection or auto-detected default */
export const getUserDistrict = (): string => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_DISTRICT);
    if (saved && ALL_30_ODISHA_DISTRICTS.includes(saved)) {
      return saved;
    }
  } catch (e) {
    // Fallback
  }
  return 'Khordha (Bhubaneswar)';
};

/** Save user district selection persistently and notify listeners */
export const setUserDistrict = (district: string): void => {
  try {
    localStorage.setItem(STORAGE_KEY_DISTRICT, district);
    window.dispatchEvent(new Event('oep-profile-updated'));
    window.dispatchEvent(new Event('oep-activity-logged'));
  } catch (e) {
    // Fallback
  }
};

/** Get live user student name */
export const getUserStudentName = (user?: any): string => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_NAME);
    if (saved && saved.trim() && saved.trim() !== 'You (Aspirant)') {
      return saved.trim();
    }
    if (user) {
      const meta = user.user_metadata || {};
      const fullName = meta.full_name || meta.name || meta.custom_name;
      if (fullName && typeof fullName === 'string' && fullName.trim()) {
        return fullName.trim();
      }
      if (user.email) {
        const raw = user.email.split('@')[0];
        const formatted = raw.replace(/[0-9_.-]/g, ' ').trim();
        if (formatted) {
          return formatted.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
      }
    }
  } catch (e) {
    // Fallback
  }
  return 'You (Aspirant)';
};

/** Save user student name */
export const setUserStudentName = (name: string): void => {
  try {
    localStorage.setItem(STORAGE_KEY_NAME, name);
    window.dispatchEvent(new Event('oep-profile-updated'));
    window.dispatchEvent(new Event('oep-activity-logged'));
  } catch (e) {
    // Fallback
  }
};

