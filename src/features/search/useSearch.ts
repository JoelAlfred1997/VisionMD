import { useCallback, useEffect, useState, type RefObject } from "react";

/**
 * In-document search via the CSS Custom Highlight API.
 *
 * Highlighting is *non-destructive*: instead of injecting `<mark>` wrappers
 * (which would fight react-markdown's virtual DOM and break on re-render), it
 * paints Range objects through `CSS.highlights`. This works identically across
 * the Document, Raw, and Split views — whatever is currently in the searched
 * container gets walked and matched.
 */

/** Highlight registry names, styled in global.css via `::highlight(...)`. */
const ALL = "vmd-search";
const ACTIVE = "vmd-search-active";

/** Feature-detect the Custom Highlight API (Chromium 105+, WebView2). */
const supported =
  typeof CSS !== "undefined" &&
  "highlights" in CSS &&
  typeof Highlight !== "undefined" &&
  typeof Range !== "undefined";

interface UseSearchOptions {
  /** The text to find (already trimmed/raw — empty disables search). */
  query: string;
  /** Whether searching is active (panel open + a document is loaded). */
  enabled: boolean;
  /** Changes whenever the searched content does (doc + view mode), forcing a
   *  re-walk after React commits new DOM. */
  contentKey: string;
}

export interface SearchState {
  /** Total matches found. */
  total: number;
  /** 1-based index of the active match, or 0 when there are none. */
  current: number;
  goNext: () => void;
  goPrev: () => void;
  /** False when the browser lacks the Custom Highlight API. */
  supported: boolean;
}

/** Maps a position in the combined text back to a (text node, offset) pair. */
interface NodeSpan {
  node: Text;
  start: number;
}

/** Walk every visible text node under `root`, skipping script/style. */
function collectSpans(root: HTMLElement): { spans: NodeSpan[]; text: string } {
  const spans: NodeSpan[] = [];
  let text = "";
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const value = node.nodeValue;
      const parent = node.parentElement;
      if (!value || !parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName;
      if (tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    spans.push({ node: textNode, start: text.length });
    text += textNode.nodeValue;
  }
  return { spans, text };
}

/**
 * Binary-search the span containing `pos`, returning the text node + local
 * offset. `isEnd` picks the boundary node for an exclusive end position.
 */
function locate(spans: NodeSpan[], pos: number, isEnd: boolean) {
  let lo = 0;
  let hi = spans.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (spans[mid].start < pos || (!isEnd && spans[mid].start <= pos)) lo = mid;
    else hi = mid - 1;
  }
  // For an end position landing exactly on a node boundary, prefer the previous
  // node's tail so the range never starts and ends on a zero-length seam.
  let i = lo;
  if (isEnd) {
    while (i > 0 && spans[i].start >= pos) i--;
  } else {
    while (i + 1 < spans.length && spans[i + 1].start <= pos) i++;
  }
  return { node: spans[i].node, offset: pos - spans[i].start };
}

/** Build a Range for every (case-insensitive) occurrence of `query`. */
function buildRanges(root: HTMLElement, query: string): Range[] {
  const ranges: Range[] = [];
  const { spans, text } = collectSpans(root);
  if (spans.length === 0) return ranges;

  const haystack = text.toLowerCase();
  const needle = query.toLowerCase();
  let from = 0;
  let idx: number;
  while ((idx = haystack.indexOf(needle, from)) !== -1) {
    const end = idx + needle.length;
    const start = locate(spans, idx, false);
    const stop = locate(spans, end, true);
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(stop.node, stop.offset);
    ranges.push(range);
    from = end;
  }
  return ranges;
}

/** Scroll the nearest scroll container so a match is comfortably in view. */
function scrollIntoView(range: Range) {
  const node = range.startContainer;
  const el =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement;
  el?.scrollIntoView({ block: "center", inline: "nearest" });
}

function clear() {
  if (!supported) return;
  CSS.highlights.delete(ALL);
  CSS.highlights.delete(ACTIVE);
}

export function useSearch(
  rootRef: RefObject<HTMLElement | null>,
  { query, enabled, contentKey }: UseSearchOptions
): SearchState {
  const [ranges, setRanges] = useState<Range[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Recompute matches whenever the query, content, or active state changes.
  useEffect(() => {
    if (!supported) return;
    const root = rootRef.current;
    if (!enabled || !root || query.length === 0) {
      clear();
      setRanges([]);
      setActiveIndex(0);
      return;
    }
    const found = buildRanges(root, query);
    setRanges(found);
    setActiveIndex(0);
    if (found.length > 0) CSS.highlights.set(ALL, new Highlight(...found));
    else CSS.highlights.delete(ALL);
    CSS.highlights.delete(ACTIVE);
  }, [query, enabled, contentKey, rootRef]);

  // Paint + scroll to the active match whenever it (or the match set) changes.
  useEffect(() => {
    if (!supported || ranges.length === 0) return;
    const idx = Math.min(activeIndex, ranges.length - 1);
    const range = ranges[idx];
    const active = new Highlight(range);
    active.priority = 1; // draw the current match on top of the rest
    CSS.highlights.set(ACTIVE, active);
    scrollIntoView(range);
  }, [ranges, activeIndex]);

  // Tidy the global registry when search is torn down.
  useEffect(() => clear, []);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (ranges.length === 0 ? 0 : (i + 1) % ranges.length));
  }, [ranges.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) =>
      ranges.length === 0 ? 0 : (i - 1 + ranges.length) % ranges.length
    );
  }, [ranges.length]);

  return {
    total: ranges.length,
    current: ranges.length === 0 ? 0 : Math.min(activeIndex, ranges.length - 1) + 1,
    goNext,
    goPrev,
    supported,
  };
}
