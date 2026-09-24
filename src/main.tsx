// ─── ROBUST POLYFILLS FOR OLDER TV BOX / MEDIA PLAYER WEBVIEWS ───
try {
  if (typeof window !== 'undefined') {
    // 1. globalThis polyfill
    if (typeof globalThis === 'undefined') {
      (window as any).globalThis = window;
    }

    // 2. ResizeObserver polyfill (crucial for recharts and custom elements)
    if (!window.ResizeObserver) {
      window.ResizeObserver = class ResizeObserver {
        observe(element: Element) {
          if (!element) return;
          // Trigger a fake immediate resize notification to prevent libraries from hanging
          setTimeout(() => {
            if (typeof this.callback === 'function') {
              this.callback([{
                contentRect: element.getBoundingClientRect(),
                target: element
              }], this);
            }
          }, 100);
        }
        unobserve() {}
        disconnect() {}
        callback: any;
        constructor(callback: any) {
          this.callback = callback;
        }
      } as any;
    }

    // 3. Object.fromEntries polyfill
    if (!Object.fromEntries) {
      Object.fromEntries = function (entries: any) {
        if (!entries || !entries[Symbol.iterator]) {
          throw new TypeError('Object.fromEntries() requires an iterable object');
        }
        var obj: any = {};
        var iterator = entries[Symbol.iterator]();
        var next = iterator.next();
        while (!next.done) {
          var entry = next.value;
          obj[entry[0]] = entry[1];
          next = iterator.next();
        }
        return obj;
      };
    }

    // 4. Array flat & flatMap polyfills
    if (!Array.prototype.flat) {
      Array.prototype.flat = function (depth: any) {
        var flattend: any[] = [];
        (function flat(arr: any[], d: number) {
          for (var i = 0; i < arr.length; i++) {
            if (Array.isArray(arr[i]) && d > 0) {
              flat(arr[i], d - 1);
            } else {
              flattend.push(arr[i]);
            }
          }
        })(this as any, depth === undefined ? 1 : depth);
        return flattend;
      };
    }
    if (!Array.prototype.flatMap) {
      Array.prototype.flatMap = function (callback: any, thisArg: any) {
        return this.map(callback, thisArg).flat();
      };
    }

    // 5. String replaceAll polyfill
    if (!String.prototype.replaceAll) {
      String.prototype.replaceAll = function (str: any, newStr: any) {
        if (Object.prototype.toString.call(str) === '[object RegExp]') {
          return this.replace(str, newStr);
        }
        return this.replace(new RegExp(str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newStr);
      };
    }

    // 6. Promise.allSettled polyfill
    if (!Promise.allSettled) {
      Promise.allSettled = function (promises: any[]) {
        return Promise.all(
          promises.map(function (promise) {
            return Promise.resolve(promise).then(
              function (value) {
                return { status: 'fulfilled', value: value };
              },
              function (reason) {
                return { status: 'rejected', reason: reason };
              }
            );
          })
        );
      } as any;
    }

    // 7. IntersectionObserver polyfill placeholder
    if (!window.IntersectionObserver) {
      window.IntersectionObserver = class IntersectionObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      } as any;
    }

    // 8. requestAnimationFrame and cancelAnimationFrame fallback
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = (window as any)[vendors[x] + 'RequestAnimationFrame'];
      window.cancelAnimationFrame = (window as any)[vendors[x] + 'CancelAnimationFrame'] || (window as any)[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function (callback) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function () {
          callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    }
    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function (id) {
        clearTimeout(id);
      };
    }
  }
} catch (e) {
  console.warn('[Polyfill Error] Failed to initialize older browser support polyfills:', e);
}

import React, { StrictMode, ErrorInfo, ReactNode } from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { purgeCorruptedMediaCache, purgeMockMediaData } from './utils/mediaUtils.ts';

// Clean up any 0-byte corrupt media cache and mock items from previous sessions
purgeCorruptedMediaCache();
purgeMockMediaData();

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorText: string;
}

// Error Boundary with pure black background for TV Box stability
class SafeErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = { hasError: false, errorText: '' };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorText: error?.message || 'Erro inesperado' };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[FastPlayer TV ErrorBoundary]:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div style={{
          backgroundColor: '#000000',
          color: '#ffffff',
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📺</div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '0.5px' }}>
            FAST<span style={{ color: '#3b82f6' }}>PLAYER</span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '400px', margin: '0 0 20px 0' }}>
            O sistema encontrou uma falha temporária. Clique no botão abaixo para reiniciar o reprodutor.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37,99,235,0.4)'
            }}
          >
            🔄 Recarregar Sistema
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SafeErrorBoundary>
      <App />
    </SafeErrorBoundary>
  </StrictMode>,
);

// Register Service Worker for offline resilience (with support for GitHub Pages / subpaths)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      const swUrl = new URL('sw.js', window.location.href).href;
      navigator.serviceWorker.register(swUrl)
        .then((reg) => {
          console.log('Service Worker registrado com sucesso:', reg.scope);
        })
        .catch((err) => {
          console.warn('Falha ao registrar Service Worker (tentando caminho relativo):', err);
          navigator.serviceWorker.register('./sw.js').catch(() => {});
        });
    } catch (e) {
      console.warn('Service Worker registration fallback error:', e);
    }
  });
}
