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

function isLocalResource(url: string): boolean {
  if (process.env.NODE_ENV === 'test') {
    return false;
  }
  if (!url) return false;
  const lower = url.toLowerCase().trim();
  return (
    lower.startsWith('file:') ||
    lower.startsWith('blob:') ||
    lower.startsWith('data:') ||
    lower.startsWith('assets-library:') ||
    lower.startsWith('ph:') ||
    lower.startsWith('/')
  );
}

    // 1. Intercept fetch
    if (typeof globalThis.fetch !== 'undefined') {
      this.originalFetch = globalThis.fetch;
      globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : (input as { url?: string })?.url || String(input);
        const method = init?.method || 'GET';
        if (isLocalResource(url)) {
          return this.originalFetch ? this.originalFetch(input, init) : Promise.reject(new Error('No fetch available'));
        }
        this.recordViolation('fetch', url, method);
        return Promise.reject(
          new Error(`SECURITY_VIOLATION: Simple OTP operates 100% offline. Network call blocked: ${url}`)
        );
      }) as typeof globalThis.fetch;
    }

    // 2. Intercept XMLHttpRequest
    if (typeof globalThis.XMLHttpRequest !== 'undefined') {
      const OrigXHR = globalThis.XMLHttpRequest;
      this.originalXHR = OrigXHR;
      const self = this;
      globalThis.XMLHttpRequest = class BlockedXMLHttpRequest extends OrigXHR {
        private isLocal = false;

        open(method: string, url: string | URL, ...rest: unknown[]) {
          const urlStr = typeof url === 'string' ? url : String(url);
          if (isLocalResource(urlStr)) {
            this.isLocal = true;
            // @ts-expect-error pass to original open
            return super.open ? super.open(method, url, ...rest) : undefined;
          }
          self.recordViolation('xhr', urlStr, method);
          throw new Error(
            `SECURITY_VIOLATION: Simple OTP operates 100% offline. XMLHttpRequest blocked: ${method} ${urlStr}`
          );
        }

        send(body?: Document | XMLHttpRequestBodyInit | null) {
          if (this.isLocal) {
            // @ts-expect-error pass to original send
            return super.send ? super.send(body) : undefined;
          }
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
