/**
 * adBlocker.ts — Rust-powered ad & tracker blocking engine
 *
 * Uses lumo-adblocker-rs (NAPI-RS native addon) for high-performance
 * URL matching with EasyList filter lists, L1 cache, and hot-rule
 * frequency tracking.
 */

import {
  initLogger,
  compileRules,
  updateFilters,
  shouldBlock as nativeShouldBlock,
} from 'lumo-adblocker-rs';

export interface AdBlockerConfig {
  enabled: boolean;
  blockAds: boolean;
  blockTrackers: boolean;
  blockSocialTrackers: boolean;
  blockCryptominers: boolean;
  blockFingerprinters: boolean;
}

export const DEFAULT_CONFIG: AdBlockerConfig = {
  enabled: true,
  blockAds: true,
  blockTrackers: true,
  blockSocialTrackers: true,
  blockCryptominers: true,
  blockFingerprinters: true,
};

initLogger();

// Pre-fetch filter lists on startup (synchronous blocking HTTP fetches in Rust thread)
const lists = updateFilters();
if (lists.length > 0) {
  compileRules(lists);
}

export function shouldBlock(url: string, _config: AdBlockerConfig): boolean {
  if (!_config.enabled) return false;
  const result = nativeShouldBlock(url, 'https://lumo-browser.local', 'script');
  return result.blocked;
}

export class AdBlockerStats {
  blocked = 0;
  allowed = 0;

  record(wasBlocked: boolean): void {
    if (wasBlocked) this.blocked++;
    else this.allowed++;
  }

  get total() { return this.blocked + this.allowed; }
  get blockRate() { return this.total === 0 ? 0 : Math.round((this.blocked / this.total) * 100); }

  reset(): void { this.blocked = 0; this.allowed = 0; }

  toJSON() {
    return {
      blocked: this.blocked,
      allowed: this.allowed,
      total: this.total,
      blockRate: this.blockRate,
    };
  }
}
