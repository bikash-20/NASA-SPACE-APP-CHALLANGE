"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Sticky-bottom scroll for chat threads.
 *
 * Behaviour:
 *  - On mount and whenever `deps` change, if the scroll container is at (or
 *    within STICK_THRESHOLD px of) the bottom, snap to the bottom.
 *  - If the user scrolls up away from the bottom, `isAtBottom` flips false
 *    and stays there until they call `scrollToBottom()` themselves
 *    (e.g. from a "Jump to latest" button or after sending a new message).
 *  - `scrollToBottom()` always scrolls and re-arms the sticky state.
 *
 * Returns the ref to attach to the scroll container and the current
 * `isAtBottom` state.
 */
export function useStickyScroll<T extends HTMLElement = HTMLDivElement>(
  deps: ReadonlyArray<unknown>
) {
  const ref = useRef<T | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Snap to the bottom when content changes if we were already pinned.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isAtBottom) {
      // Two RAFs: one for layout settle, one for paint. Handles delta
      // appends that grow the last assistant message mid-stream.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
        });
      });
    }
    // We intentionally don't include `isAtBottom`: the parent useEffect
    // re-runs whenever deps change, and the sticky state is read from the
    // ref at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const next = distance < 24;
    setIsAtBottom((prev) => (prev === next ? prev : next));
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setIsAtBottom(true);
  }, []);

  return { ref, isAtBottom, onScroll, scrollToBottom };
}
