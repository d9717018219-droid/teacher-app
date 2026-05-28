import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(num: string | number | undefined) {
  if (!num) return '0';
  const x = num.toString().replace(/[^0-9]/g, "");
  let lastThree = x.substring(x.length - 3);
  const otherNumbers = x.substring(0, x.length - 3);
  if (otherNumbers !== '') lastThree = ',' + lastThree;
  return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
}

export function formatPostedDate(dateStr: string | undefined) {
  if (!dateStr || dateStr === '0000-00-00 00:00:00') return 'Recently';
  const date = new Date(dateStr.replace(/-/g, "/"));
  const options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: 'short', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  };
  return date.toLocaleString('en-IN', options);
}

export function formatWhatsAppStyle(date: Date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (targetDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (targetDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }
}

const listA = ["Ghaziabad", "Faridabad", "Delhi", "Ahmedabad", "Mumbai", "Pune", "Chandigarh", "Mohali", "Panchkula", "Bhopal", "Indore", "Guwahati", "Jaipur"];
const listB = ["Gurgaon", "Noida", "Greater Noida", "Chennai", "Hyderabad", "Bangalore", "Patna", "Lucknow", "Kanpur"];

export function getCityPhone(city: string | undefined) {
  return "9971969197";
}

export function getJobTheme() {
  return { 
    grad: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)', // Sky Blue
    solid: '#0ea5e9' 
  };
}

export function getTutorTheme() {
  return { 
    grad: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)', // Light Orange
    solid: '#f97316' 
  };
}

export function getCityTheme(city: string | undefined) {
  const cityName = (city || 'Default').trim();
  
  // Better hash function for more entropy
  let hash1 = 0;
  for (let i = 0; i < cityName.length; i++) {
    hash1 = ((hash1 << 5) - hash1) + cityName.charCodeAt(i);
    hash1 |= 0;
  }
  
  let hash2 = 0;
  for (let i = cityName.length - 1; i >= 0; i--) {
    hash2 = ((hash2 << 5) - hash2) + cityName.charCodeAt(i);
    hash2 |= 0;
  }

  // Use the hashes to determine HSL values
  // We keep saturation and lightness in a "professional" range
  const h1 = Math.abs(hash1 % 360);
  const h2 = Math.abs(hash2 % 360);
  
  // Choose pairs that aren't too close to ensure a nice gradient
  const finalH2 = Math.abs(h1 - h2) < 30 ? (h2 + 60) % 360 : h2;

  // Professional ranges: Saturation (60-80%), Lightness (30-45%) for dark themes
  const s = 65 + (Math.abs(hash1 % 15)); // 65-80%
  const l = 32 + (Math.abs(hash2 % 10)); // 32-42%

  return { 
    grad: `linear-gradient(135deg, hsl(${h1}, ${s}%, ${l}%) 0%, hsl(${finalH2}, ${s}%, ${l + 5}%) 100%)`, 
    solid: `hsl(${h1}, ${s}%, ${l}%)` 
  };
}

export function toTitleCase(str: string | undefined) {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

export function getJobId(job: any): string {
  if (!job) return 'N/A';
  return (job['Order ID'] || job.id || 'N/A').toString();
}

export function getTutorId(tutor: any): string {
  if (!tutor) return 'N/A';
  return (tutor.tutor_id || tutor['Tutor ID'] || tutor.tutorId || tutor.id || tutor.ID || 'N/A').toString();
}

/**
 * Robust WhatsApp redirection for mobile apps
 */
export function cleanValue(val: any): string {
  if (val === null || val === undefined) return '';
  return val.toString().replace(/[\[\]"]/g, '');
}

export function openWhatsApp(text: string) {
  openWhatsAppTo('9971969197', text);
}

export function openWhatsAppTo(phone: string, text: string) {
  // Clean phone number: remove everything except digits
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  // If number doesn't have country code and is 10 digits (India), add 91
  const finalPhone = (cleanPhone.length === 10) ? `91${cleanPhone}` : cleanPhone;
  
  // Use wa.me for standard redirection
  const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`;
  
  // For Capacitor Android, using _system is the standard way to open in system browser/app
  // If it's not allowed in capacitor.config.ts (which we just fixed), 
  // the OS should intercept this and open WhatsApp.
  try {
    window.open(url, '_system');
  } catch (e) {
    window.open(url, '_blank');
  }
}

// ─── IndexedDB Storage for Large Data ─────────────────────────────
const DB_NAME = 'DoAbleUserAppDB';
const STORE_NAME = 'appCache';

export async function saveToLargeStorage(key: string, data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(data, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getFromLargeStorage(key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readonly');
      const getReq = tx.objectStore(STORE_NAME).get(key);
      getReq.onsuccess = () => resolve(getReq.result);
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
}
