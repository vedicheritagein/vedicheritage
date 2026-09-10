import { useEffect, useState } from 'react';
import type { SectionId } from '../config/site';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Scrolls a section into view, honouring the reduced-motion preference.
 *
 * Returns false when the id is not on the page so callers can fall back rather
 * than appearing to do nothing - which is how the original `href="#"` links
 * behaved.
 */
export function scrollToSection(id: SectionId | string): boolean {
  const target = document.getElementById(id);
  if (!target) return false;

  target.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
  });
  return true;
}

export function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

/**
 * Tracks which section is currently in view so the navbar can highlight it.
 *
 * The original navbar hard-coded `active: true` on "Home", so the highlight sat
 * on Home even at the bottom of the page. This drives the same styling from the
 * actual scroll position.
 *
 * Implemented with an IntersectionObserver rather than a scroll listener: the
 * observer reports position changes however they were caused, whereas `scroll`
 * events are coalesced and can be skipped entirely for a programmatic jump,
 * which left the highlight stale.
 *
 * `rootMargin` crops the observation area to the top third of the viewport, so a
 * section counts as current once its top edge reaches roughly where a reader is
 * looking - not when it first peeks in at the bottom. Sections are much taller
 * than that band, so several can qualify at once and the last one in document
 * order wins.
 */
export function useActiveSection(ids: readonly string[]): string {
  const [active, setActive] = useState(ids[0] ?? '');

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
      // Document order, which is not the navbar's order ("Artist" is listed
      // before "About the event", but its section comes after).
      .sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
      );

    if (elements.length === 0) return;

    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id;
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        }

        // Last qualifying section in document order. When nothing qualifies -
        // scrolled past the tracked sections, into the footer - the previous
        // value is kept rather than snapping back to the first link.
        for (let i = elements.length - 1; i >= 0; i--) {
          if (visible.has(elements[i].id)) {
            setActive(elements[i].id);
            return;
          }
        }
      },
      { rootMargin: '0px 0px -66% 0px', threshold: 0 }
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
