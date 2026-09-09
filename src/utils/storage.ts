import type { BudgetConfig } from '../types/budget';
import { getDefaultBudgetData } from './defaultData';

const STORAGE_KEY = 'budget_forecaster_config_v1';

export type SyncStatus = 'synced' | 'syncing' | 'error';

let currentSyncStatus: SyncStatus = 'synced';
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingDiskPayload: BudgetConfig | null = null;
const syncStatusListeners: Set<(status: SyncStatus) => void> = new Set();

export function getSyncStatus(): SyncStatus {
  return currentSyncStatus;
}

export function subscribeSyncStatus(listener: (status: SyncStatus) => void): () => void {
  syncStatusListeners.add(listener);
  listener(currentSyncStatus);
  return () => {
    syncStatusListeners.delete(listener);
  };
}

function notifySyncStatus(status: SyncStatus): void {
  currentSyncStatus = status;
  syncStatusListeners.forEach(listener => {
    try {
      listener(status);
    } catch (e) {
      console.error('Error in sync status listener:', e);
    }
  });
}

function normalizeConfig(parsed: any): BudgetConfig {
  const defaultData = getDefaultBudgetData();
  return {
    account: { ...defaultData.account, ...(parsed.account || {}) },
    incomes: parsed.incomes || defaultData.incomes,
    bills: parsed.bills || defaultData.bills,
    creditCards: (parsed.creditCards || defaultData.creditCards).map((c: any) => ({
      ...c,
      extraPayments: c.extraPayments || [],
    })),
    autoDeposits: parsed.autoDeposits || defaultData.autoDeposits,
    transactions: parsed.transactions || [],
  };
}

export function loadBudgetConfig(): BudgetConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaultData = getDefaultBudgetData();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData, null, 2));
      } catch {
        // ignore
      }
      return defaultData;
    }
    const parsed = JSON.parse(raw);
    return normalizeConfig(parsed);
  } catch (err) {
    console.error('Failed to load budget configuration from localStorage:', err);
    return getDefaultBudgetData();
  }
}

export async function loadBudgetConfigFromDisk(): Promise<BudgetConfig> {
  try {
    const response = await fetch('/api/budget-config');
    if (response.ok) {
      const data = await response.json();
      if (data && typeof data === 'object' && (data.account || data.incomes)) {
        const normalized = normalizeConfig(data);
        // Sync to localStorage cache
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized, null, 2));
        } catch {
          // ignore localstorage quota errors
        }
        notifySyncStatus('synced');
        return normalized;
      }
    }
  } catch (err) {
    console.info('Disk API not reachable; falling back to browser storage:', err);
  }
  return loadBudgetConfig();
}

/**
 * Flush any debounced pending changes directly to disk now.
 */
export async function flushPendingDiskSave(): Promise<boolean> {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (!pendingDiskPayload) {
    notifySyncStatus('synced');
    return true;
  }

  const payload = pendingDiskPayload;
  pendingDiskPayload = null;
  notifySyncStatus('syncing');

  try {
    const res = await fetch('/api/budget-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload, null, 2),
    });
    if (res.ok) {
      notifySyncStatus('synced');
      return true;
    } else {
      notifySyncStatus('error');
      return false;
    }
  } catch (err) {
    console.warn('Disk auto-flush error:', err);
    notifySyncStatus('error');
    return false;
  }
}

/**
 * Automatically saves to localStorage immediately (0ms) and schedules
 * an automatic debounced flush to budget-data.json on disk (500ms).
 */
export function saveBudgetConfig(config: BudgetConfig): void {
  // 1. Immediately save to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config, null, 2));
  } catch (err) {
    console.error('Failed to save budget configuration to localStorage:', err);
  }

  // 2. Queue debounced disk flush
  pendingDiskPayload = config;
  notifySyncStatus('syncing');

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    flushPendingDiskSave();
  }, 500);
}

export async function saveBudgetConfigToDisk(config: BudgetConfig): Promise<boolean> {
  pendingDiskPayload = config;
  return flushPendingDiskSave();
}

// Emergency flush on tab close/refresh
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (pendingDiskPayload) {
      const blob = new Blob([JSON.stringify(pendingDiskPayload, null, 2)], {
        type: 'application/json',
      });
      navigator.sendBeacon('/api/budget-config', blob);
    }
  });
}

export function exportConfigAsJson(config: BudgetConfig): void {
  const jsonStr = JSON.stringify(config, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `budget-forecast-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function importConfigFromJson(file: File): Promise<BudgetConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as BudgetConfig;
        if (!parsed.account || !Array.isArray(parsed.incomes)) {
          throw new Error('Invalid budget configuration JSON structure');
        }
        resolve(normalizeConfig(parsed));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
