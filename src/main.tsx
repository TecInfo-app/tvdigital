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

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register Service Worker for offline resilience
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('Service Worker registrado com sucesso:', reg.scope);
      })
      .catch((err) => {
        console.warn('Falha ao registrar Service Worker:', err);
      });
  });
}
