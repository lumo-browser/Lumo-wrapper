/**
 * adBlocker.ts — Ad & tracker blocking engine (disabled build)
 *
 * The native lumo-adblocker-rs addon is not bundled in this build,
 * so all blocking checks are no-ops.
 */

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

export function shouldBlock(_url: string, _config: AdBlockerConfig): boolean {
  return false;
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
