/**
 * Single place to set the tab favicon. Only updates the main rel="icon" link;
 * does not remove other link types (e.g. apple-touch-icon), so the favicon
 * does not disappear when switching views or when a logo URL fails to load.
 *
 * - Use href = null (or omit) to set the default Packets Out (admin) logo.
 * - Use href = school.logo for school context so each school's logo is the favicon.
 */

const DEFAULT_FAVICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="6" y="6" width="5" height="20" rx="2.5" fill="#111827"/><rect x="14" y="9" width="5" height="17" rx="2.5" fill="#111827"/><path d="M22 11L27 9L28 14L24 15.5L22 11Z" fill="none" stroke="#0EA5E9" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 11L25.5 14.5L28 14" fill="none" stroke="#0EA5E9" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const DEFAULT_FAVICON_HREF = `data:image/svg+xml,${encodeURIComponent(DEFAULT_FAVICON_SVG)}`;

export function setFavicon(href: string | null | undefined): void {
  if (typeof document === 'undefined') return;
  try {
    const head = document.head || document.getElementsByTagName('head')[0];
    if (!head) return;

    const effectiveHref = href && href.trim() ? href : DEFAULT_FAVICON_HREF;

    let link = head.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      head.appendChild(link);
    }
    link.href = effectiveHref;
  } catch {
    // ignore
  }
}
