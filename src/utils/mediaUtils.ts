// Media utility helpers for FastPlayer Digital Signage

/**
 * Sanitizes URLs for media playback (e.g. converting Dropbox sharing links to direct raw streaming URLs)
 */
export const sanitizeMediaUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  let clean = url.trim();

  // Convert Dropbox sharing URLs to direct content streaming links
  if (clean.includes('dropbox.com')) {
    // If it has dl=0, change to raw=1
    if (clean.includes('dl=0')) {
      clean = clean.replace('dl=0', 'raw=1');
    } else if (!clean.includes('raw=1') && !clean.includes('dl=1')) {
      clean = clean.includes('?') ? `${clean}&raw=1` : `${clean}?raw=1`;
    }
    // Replace www.dropbox.com with dl.dropboxusercontent.com for direct byte streaming
    clean = clean.replace(/([a-zA-Z0-9-]+\.)?dropbox\.com/, 'dl.dropboxusercontent.com');
  }

  // Google Drive preview URL to direct stream URL
  if (clean.includes('drive.google.com/file/d/')) {
    const match = clean.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      clean = `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
  }

  return clean;
};

/**
 * Checks whether a URL or media item is a video
 */
export const isVideoMedia = (type?: string, url?: string): boolean => {
  if (type && type.toLowerCase().includes('video')) return true;
  if (!url) return false;
  const clean = url.toLowerCase();
  return clean.startsWith('data:video/') || /\.(mp4|webm|mkv|mov|m4v|ogg)(\?.*)?$/i.test(clean);
};

/**
 * Cache Storage helper for Offline Media
 * IMPORTANT: 
 * 1. Videos stream via native HTTP 206 Partial Content range requests and must NOT be converted to 0-byte blobs.
 * 2. Never cache opaque responses (mode: 'no-cors') as Blobs, because opaque responses have 0-byte unreadable bodies
 *    which causes Chromium to fail with net::ERR_REQUEST_RANGE_NOT_SATISFIABLE.
 */
export const getCachedMediaUrl = async (url: string): Promise<string> => {
  if (!url || !url.startsWith('http')) {
    return url;
  }

  const sanitized = sanitizeMediaUrl(url);

  // Video files should stream directly via HTTP/HTTPS Range requests
  if (isVideoMedia(undefined, sanitized)) {
    return sanitized;
  }

  if (typeof window === 'undefined' || !('caches' in window)) {
    return sanitized;
  }

  try {
    const cache = await caches.open('fastplayer-media-cache');
    const cachedResponse = await cache.match(sanitized);
    if (cachedResponse) {
      const blob = await cachedResponse.blob();
      // Ensure the cached blob is valid and not an empty/opaque 0-byte artifact
      if (blob && blob.size > 0) {
        return URL.createObjectURL(blob);
      } else {
        // Purge invalid 0-byte entry
        await cache.delete(sanitized);
      }
    }

    // Try standard CORS fetch to store in cache
    const response = await fetch(sanitized);
    if (response.ok) {
      await cache.put(sanitized, response.clone());
      const blob = await response.blob();
      if (blob && blob.size > 0) {
        return URL.createObjectURL(blob);
      }
    }
  } catch (error) {
    // Network error or CORS restriction on external host.
    // Gracefully fallback to sanitized direct URL without caching corrupted opaque responses.
    console.warn("[MediaCache] Direct streaming fallback for:", sanitized, error);
  }

  return sanitized;
};

/**
 * Cleans up any corrupted 0-byte entries from previously broken cache runs
 */
export const purgeCorruptedMediaCache = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const cache = await caches.open('fastplayer-media-cache');
    const keys = await cache.keys();
    for (const req of keys) {
      const res = await cache.match(req);
      if (res) {
        const blob = await res.blob().catch(() => null);
        if (!blob || blob.size === 0) {
          await cache.delete(req);
        }
      }
    }
  } catch (err) {
    console.warn("[MediaCache] Purge notice:", err);
  }
};

/**
 * Cleans up any mock media items lingering in local storage
 */
export const purgeMockMediaData = (): void => {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('local_media_items');
    if (raw) {
      const items = JSON.parse(raw);
      if (Array.isArray(items)) {
        const hasMock = items.some((i: any) => i.id === 'media-1' || i.id === 'media-2' || i.id === 'media-3' || (typeof i.name === 'string' && i.name.includes('Summer_Tech_Sale')));
        if (hasMock) {
          const filtered = items.filter((i: any) => i.id !== 'media-1' && i.id !== 'media-2' && i.id !== 'media-3' && !(typeof i.name === 'string' && i.name.includes('Summer_Tech_Sale')));
          if (filtered.length > 0) {
            localStorage.setItem('local_media_items', JSON.stringify(filtered));
          } else {
            localStorage.removeItem('local_media_items');
          }
        }
      }
    }
  } catch (err) {
    console.warn("[MediaCache] purgeMockMediaData notice:", err);
  }
};

