import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getImageUrl } from '@/lib/utils';

type BackupEntry =
  | { kind: 'title'; prev: string }
  | { kind: 'meta'; el: HTMLMetaElement; prevContent: string | null; created: boolean };

function findMeta(attr: 'property' | 'name', key: string): HTMLMetaElement | null {
  return document.head.querySelector(`meta[${attr}="${key}"]`);
}

function setOrCreateMeta(attr: 'property' | 'name', key: string, content: string): BackupEntry {
  let el = findMeta(attr, key);
  const created = !el;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
    el.setAttribute('content', content);
    return { kind: 'meta', el, prevContent: null, created: true };
  }
  const prevContent = el.getAttribute('content');
  el.setAttribute('content', content);
  return { kind: 'meta', el, prevContent, created: false };
}

function rollback(entries: BackupEntry[]) {
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i]!;
    if (e.kind === 'title') {
      document.title = e.prev;
    } else if (e.created) {
      e.el.remove();
    } else if (e.prevContent === null) {
      e.el.removeAttribute('content');
    } else {
      e.el.setAttribute('content', e.prevContent);
    }
  }
}

function toAbsoluteOgImage(imageUrl: string, pageOrigin: string): string | null {
  if (!imageUrl || imageUrl.includes('placeholder.svg')) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${pageOrigin}${path}`;
}

/** Sets document title + OG/Twitter tags so shared registration URLs preview with event artwork. Cleans up on route change/unmount. */
export function useRegistrationShareMeta(opts: {
  enabled: boolean;
  title: string | null | undefined;
  description?: string | null | undefined;
  imageRaw: string | null | undefined;
}) {
  const location = useLocation();

  useEffect(() => {
    if (!opts.enabled || !opts.title?.trim()) return;

    const title = opts.title.trim();
    const rawDesc =
      opts.description && typeof opts.description === 'string' ? opts.description.trim() : '';
    const description = (rawDesc || `Register for ${title}`).slice(0, 300);

    const pageOrigin = window.location.origin;
    const canonicalUrl = `${pageOrigin}${location.pathname}${location.search}`;

    const resolved = opts.imageRaw ? getImageUrl(opts.imageRaw) : '';
    const ogImage = resolved ? toAbsoluteOgImage(resolved, pageOrigin) : null;

    const backup: BackupEntry[] = [];
    backup.push({ kind: 'title', prev: document.title });
    document.title = title;

    backup.push(setOrCreateMeta('property', 'og:title', title));
    backup.push(setOrCreateMeta('property', 'og:description', description));
    if (ogImage) {
      backup.push(setOrCreateMeta('property', 'og:image', ogImage));
    }
    backup.push(setOrCreateMeta('property', 'og:url', canonicalUrl));
    backup.push(setOrCreateMeta('property', 'og:type', 'website'));
    backup.push(setOrCreateMeta('name', 'twitter:card', ogImage ? 'summary_large_image' : 'summary'));
    backup.push(setOrCreateMeta('name', 'twitter:title', title));
    backup.push(setOrCreateMeta('name', 'twitter:description', description));
    if (ogImage) {
      backup.push(setOrCreateMeta('name', 'twitter:image', ogImage));
    }
    backup.push(setOrCreateMeta('name', 'description', description));

    return () => rollback(backup);
  }, [
    opts.enabled,
    opts.title,
    opts.description,
    opts.imageRaw,
    location.pathname,
    location.search,
  ]);
}
