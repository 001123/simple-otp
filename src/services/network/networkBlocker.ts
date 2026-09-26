/**
 * Zero-Network Perimeter Barrier
 * Hard fail-closed runtime interceptor guaranteeing 0 outbound network requests.
 * Blocks fetch, XMLHttpRequest, WebSocket, EventSource, and sendBeacon.
 */

export interface NetworkViolation {
  api: 'fetch' | 'xhr' | 'websocket' | 'eventsource' | 'sendBeacon';
  url: string;
  method?: string;
  timestamp: number;
}

export class NetworkBlocker {
  private active = false;
  private violations: NetworkViolation[] = [];
  private originalFetch: typeof globalThis.fetch | null = null;
  private originalXHR: typeof globalThis.XMLHttpRequest | null = null;
  private originalWebSocket: typeof globalThis.WebSocket | null = null;
  private originalEventSource: unknown = null;
  private originalSendBeacon: unknown = null;

  install(): void {
    if (this.active) return;
    this.active = true;
    this.violations = [];

    // 1. Intercept fetch
    if (typeof globalThis.fetch !== 'undefined') {
      this.originalFetch = globalThis.fetch;
      globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : (input as { url?: string })?.url || String(input);
        const method = init?.method || 'GET';
        this.recordViolation('fetch', url, method);
        return Promise.reject(
          new Error(`SECURITY_VIOLATION: Simple OTP operates 100% offline. Network call blocked: ${url}`)
        );
      }) as typeof globalThis.fetch;
    }

    // 2. Intercept XMLHttpRequest
    if (typeof globalThis.XMLHttpRequest !== 'undefined') {
      this.originalXHR = globalThis.XMLHttpRequest;
      const self = this;
      // @ts-expect-error Mock class replacement
      globalThis.XMLHttpRequest = class BlockedXMLHttpRequest {
        open(method: string, url: string | URL) {
          const urlStr = String(url);
          self.recordViolation('xhr', urlStr, method);
          throw new Error(
            `SECURITY_VIOLATION: Simple OTP operates 100% offline. XMLHttpRequest blocked: ${method} ${urlStr}`
          );
        }
        send() {
          throw new Error('SECURITY_VIOLATION: Simple OTP operates 100% offline. XMLHttpRequest blocked.');
        }
        setRequestHeader() {}
        abort() {}
        addEventListener() {}
        removeEventListener() {}
      };
    }

    // 3. Intercept WebSocket
    if (typeof globalThis.WebSocket !== 'undefined') {
      this.originalWebSocket = globalThis.WebSocket;
      const self = this;
      // @ts-expect-error Mock class replacement
      globalThis.WebSocket = class BlockedWebSocket {
        constructor(url: string | URL) {
          const urlStr = String(url);
          self.recordViolation('websocket', urlStr);
          throw new Error(`SECURITY_VIOLATION: Simple OTP operates 100% offline. WebSocket blocked: ${urlStr}`);
        }
      };
    }

    // 4. Intercept EventSource
    const g = globalThis as Record<string, unknown>;
    if (typeof g.EventSource !== 'undefined') {
      this.originalEventSource = g.EventSource;
      const self = this;
      g.EventSource = class BlockedEventSource {
        constructor(url: string | URL) {
          const urlStr = String(url);
          self.recordViolation('eventsource', urlStr);
          throw new Error(`SECURITY_VIOLATION: Simple OTP operates 100% offline. EventSource blocked: ${urlStr}`);
        }
      };
    }

    // 5. Intercept navigator.sendBeacon
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator && typeof navigator.sendBeacon === 'function') {
      this.originalSendBeacon = navigator.sendBeacon.bind(navigator);
      navigator.sendBeacon = (url: string | URL): boolean => {
        const urlStr = String(url);
        this.recordViolation('sendBeacon', urlStr);
        return false;
      };
    }
  }

  uninstall(): void {
    if (!this.active) return;

    if (this.originalFetch) globalThis.fetch = this.originalFetch;
    if (this.originalXHR) globalThis.XMLHttpRequest = this.originalXHR;
    if (this.originalWebSocket) globalThis.WebSocket = this.originalWebSocket;
    const g = globalThis as Record<string, unknown>;
    if (this.originalEventSource) g.EventSource = this.originalEventSource;
    if (this.originalSendBeacon && typeof navigator !== 'undefined') {
      (navigator as unknown as { sendBeacon: unknown }).sendBeacon = this.originalSendBeacon;
    }

    this.active = false;
  }

  private recordViolation(api: NetworkViolation['api'], url: string, method?: string): void {
    this.violations.push({
      api,
      url,
      method,
      timestamp: Date.now(),
    });
  }

  isActive(): boolean {
    return this.active;
  }

  getViolationCount(): number {
    return this.violations.length;
  }

  getViolations(): NetworkViolation[] {
    return [...this.violations];
  }

  clearViolations(): void {
    this.violations = [];
  }
}

export const networkBlocker = new NetworkBlocker();

export function installNetworkBlocker(): void {
  networkBlocker.install();
}

export function uninstallNetworkBlocker(): void {
  networkBlocker.uninstall();
}

export function getNetworkViolationLog(): NetworkViolation[] {
  return networkBlocker.getViolations();
}

export function isNetworkBlockerActive(): boolean {
  return networkBlocker.isActive();
}
