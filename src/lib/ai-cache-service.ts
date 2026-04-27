import { getSheetData, appendSheetData, initializeSheetHeaders, deleteSheetRow } from './sheets-service';

// ============================================
// AI CACHE SERVICE — Daily Caching System
// Semua respons AI di-cache per hari (WIB timezone).
// Auto-refresh di jam 00:00 WIB (cache expired = tanggal berbeda).
// ============================================

const SHEET_NAME = 'AI_CACHE';
const HEADERS = ['cache_key', 'cache_date', 'data_json', 'created_at'];

interface CacheRecord {
  cache_key: string;
  cache_date: string;
  data_json: string;
  created_at: string;
}

/**
 * Get today's date in WIB timezone (YYYY-MM-DD format).
 * This is the "cache day" — all cache entries expire at midnight WIB.
 */
export function getTodayWIB(): string {
  const now = new Date();
  // WIB is UTC+7
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().split('T')[0];
}

/**
 * Check if a cache entry is valid for today.
 */
function isCacheValidForToday(cacheDate: string): boolean {
  return cacheDate === getTodayWIB();
}

/**
 * Get cached AI response for a given key.
 * Returns the parsed data if cache exists and is valid for today.
 * Returns null if cache is expired or doesn't exist.
 */
export async function getCachedResponse<T = any>(cacheKey: string): Promise<T | null> {
  try {
    await initializeSheetHeaders(SHEET_NAME, HEADERS);
    const records = await getSheetData<CacheRecord>(SHEET_NAME);

    // Find matching cache entry
    const entry = records.find(
      (r) => r.cache_key === cacheKey && isCacheValidForToday(r.cache_date)
    );

    if (entry && entry.data_json) {
      try {
        return JSON.parse(entry.data_json) as T;
      } catch {
        console.warn(`[AI Cache] Failed to parse cached data for key: ${cacheKey}`);
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error('[AI Cache] Error reading cache:', error);
    return null;
  }
}

/**
 * Save AI response to cache.
 * Overwrites any existing entry for the same key (deletes old, inserts new).
 */
export async function setCachedResponse(cacheKey: string, data: any): Promise<void> {
  try {
    await initializeSheetHeaders(SHEET_NAME, HEADERS);

    // Delete old entries for this key
    const records = await getSheetData<CacheRecord>(SHEET_NAME);
    for (const record of records) {
      if (record.cache_key === cacheKey) {
        try {
          await deleteSheetRow(SHEET_NAME, 0, cacheKey);
        } catch {
          // Ignore delete errors — might not exist
        }
        break;
      }
    }

    // Insert new cache entry
    const dataJson = JSON.stringify(data);
    await appendSheetData(SHEET_NAME, [
      cacheKey,
      getTodayWIB(),
      dataJson,
      new Date().toISOString(),
    ]);

    console.log(`[AI Cache] Cached response for key: ${cacheKey} (date: ${getTodayWIB()})`);
  } catch (error) {
    console.error('[AI Cache] Error writing cache:', error);
    // Don't throw — caching failure shouldn't break the main flow
  }
}

/**
 * Get the timestamp of when the cache was last updated for a key.
 * Returns null if no cache exists.
 */
export async function getCacheTimestamp(cacheKey: string): Promise<string | null> {
  try {
    await initializeSheetHeaders(SHEET_NAME, HEADERS);
    const records = await getSheetData<CacheRecord>(SHEET_NAME);
    const entry = records.find(
      (r) => r.cache_key === cacheKey && isCacheValidForToday(r.cache_date)
    );
    return entry?.created_at || null;
  } catch {
    return null;
  }
}
