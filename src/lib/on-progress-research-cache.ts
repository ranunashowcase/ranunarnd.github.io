import { getSheetData, appendSheetData, updateSheetRow, initializeSheetHeaders } from './sheets-service';

// ============================================
// PERSISTENT RESEARCH CACHE — Product On Progress
// Cache ini TIDAK expire setiap midnight.
// Riset tersimpan permanen sampai user refresh manual.
// Refresh manual dibatasi 2x per hari (WIB timezone).
// ============================================

const SHEET_NAME = 'RND_PRODUCT_RESEARCH';
const HEADERS = [
  'product_id',
  'research_data',
  'created_at',
  'last_refreshed_at',
  'refresh_count_today',
  'refresh_date',
];

const MAX_REFRESH_PER_DAY = 2;

interface ResearchCacheRecord {
  product_id: string;
  research_data: string;
  created_at: string;
  last_refreshed_at: string;
  refresh_count_today: string;
  refresh_date: string;
}

/**
 * Get today's date in WIB timezone (YYYY-MM-DD format).
 */
function getTodayWIB(): string {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().split('T')[0];
}

/**
 * Get cached research for a product.
 * Returns the parsed research data if it exists (no expiry — persisten).
 * Returns null if no research exists yet.
 */
export async function getProductResearch<T = any>(productId: string): Promise<{
  data: T | null;
  created_at: string | null;
  last_refreshed_at: string | null;
  refresh_remaining: number;
}> {
  try {
    await initializeSheetHeaders(SHEET_NAME, HEADERS);
    const records = await getSheetData<ResearchCacheRecord>(SHEET_NAME);
    const entry = records.find((r) => r.product_id === productId);

    if (!entry || !entry.research_data) {
      return { data: null, created_at: null, last_refreshed_at: null, refresh_remaining: MAX_REFRESH_PER_DAY };
    }

    // Check if refresh_date is today — if not, reset counter
    const todayWIB = getTodayWIB();
    let refreshCountToday = parseInt(entry.refresh_count_today || '0', 10) || 0;

    if (entry.refresh_date !== todayWIB) {
      // Different day → counter is effectively 0
      refreshCountToday = 0;
    }

    const refreshRemaining = Math.max(0, MAX_REFRESH_PER_DAY - refreshCountToday);

    let parsed: T | null = null;
    try {
      parsed = JSON.parse(entry.research_data) as T;
    } catch {
      console.warn(`[Research Cache] Failed to parse research data for product: ${productId}`);
    }

    return {
      data: parsed,
      created_at: entry.created_at || null,
      last_refreshed_at: entry.last_refreshed_at || null,
      refresh_remaining: refreshRemaining,
    };
  } catch (error) {
    console.error('[Research Cache] Error reading cache:', error);
    return { data: null, created_at: null, last_refreshed_at: null, refresh_remaining: MAX_REFRESH_PER_DAY };
  }
}

/**
 * Check if a product can refresh its research today.
 * Returns { canRefresh, remaining, message }.
 */
export async function canRefreshToday(productId: string): Promise<{
  canRefresh: boolean;
  remaining: number;
  message: string;
}> {
  try {
    await initializeSheetHeaders(SHEET_NAME, HEADERS);
    const records = await getSheetData<ResearchCacheRecord>(SHEET_NAME);
    const entry = records.find((r) => r.product_id === productId);

    if (!entry) {
      // No existing research — first generation doesn't count as refresh
      return { canRefresh: true, remaining: MAX_REFRESH_PER_DAY, message: 'Riset pertama kali' };
    }

    const todayWIB = getTodayWIB();
    let refreshCountToday = parseInt(entry.refresh_count_today || '0', 10) || 0;

    // Reset counter if it's a new day
    if (entry.refresh_date !== todayWIB) {
      refreshCountToday = 0;
    }

    const remaining = Math.max(0, MAX_REFRESH_PER_DAY - refreshCountToday);

    if (remaining <= 0) {
      return {
        canRefresh: false,
        remaining: 0,
        message: `Batas refresh sudah tercapai (${MAX_REFRESH_PER_DAY}x per hari). Coba lagi besok.`,
      };
    }

    return {
      canRefresh: true,
      remaining,
      message: `Sisa ${remaining}x refresh hari ini`,
    };
  } catch (error) {
    console.error('[Research Cache] Error checking refresh limit:', error);
    return { canRefresh: true, remaining: MAX_REFRESH_PER_DAY, message: 'Error checking limit' };
  }
}

/**
 * Save or update research data for a product.
 * isRefresh = true → increment daily counter.
 * isRefresh = false → first-time generation (no counter increment).
 */
export async function saveProductResearch(
  productId: string,
  data: any,
  isRefresh: boolean = false
): Promise<void> {
  try {
    await initializeSheetHeaders(SHEET_NAME, HEADERS);
    const records = await getSheetData<ResearchCacheRecord>(SHEET_NAME);
    const existingEntry = records.find((r) => r.product_id === productId);
    const now = new Date().toISOString();
    const todayWIB = getTodayWIB();
    const dataJson = JSON.stringify(data);

    if (existingEntry) {
      // Update existing entry
      let refreshCountToday = parseInt(existingEntry.refresh_count_today || '0', 10) || 0;

      // Reset counter if new day
      if (existingEntry.refresh_date !== todayWIB) {
        refreshCountToday = 0;
      }

      if (isRefresh) {
        refreshCountToday += 1;
      }

      const updatedRow = [
        productId,
        dataJson,
        existingEntry.created_at || now, // Keep original created_at
        now, // Update last_refreshed_at
        String(refreshCountToday),
        todayWIB,
      ];

      await updateSheetRow(SHEET_NAME, 0, productId, updatedRow);
      console.log(`[Research Cache] Updated research for product: ${productId} (refresh: ${isRefresh}, count: ${refreshCountToday})`);
    } else {
      // Insert new entry
      await appendSheetData(SHEET_NAME, [
        productId,
        dataJson,
        now, // created_at
        now, // last_refreshed_at
        '0', // refresh_count_today (first generation doesn't count)
        todayWIB,
      ]);
      console.log(`[Research Cache] Saved initial research for product: ${productId}`);
    }
  } catch (error) {
    console.error('[Research Cache] Error saving research:', error);
    // Don't throw — cache failure shouldn't break the main flow
  }
}
