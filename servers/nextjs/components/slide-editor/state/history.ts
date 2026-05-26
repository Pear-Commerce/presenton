import { atom } from "jotai";
import type { Deck } from "../lib/slide-schema";
import { deckAtom } from "./atoms";

const HISTORY_LIMIT = 100;
const COALESCE_MS = 600;

const undoStackAtom = atom<Deck[]>([]);
const redoStackAtom = atom<Deck[]>([]);
const lastPushAtom = atom<{ tag: string | undefined; ts: number } | null>(null);

export const canUndoAtom = atom((get) => get(undoStackAtom).length > 0);
export const canRedoAtom = atom((get) => get(redoStackAtom).length > 0);

// Capture the current deck as a restore point. Subsequent pushes with the same
// `tag` inside COALESCE_MS are skipped so a burst of fine-grained edits (e.g.
// typing in a textarea) collapses into a single undo step.
export const pushHistoryAtom = atom(
  null,
  (get, set, options?: { tag?: string }) => {
    const last = get(lastPushAtom);
    const now = Date.now();
    if (
      last &&
      options?.tag != null &&
      last.tag === options.tag &&
      now - last.ts < COALESCE_MS
    ) {
      set(lastPushAtom, { tag: options.tag, ts: now });
      return;
    }
    const snapshot = get(deckAtom);
    const stack = get(undoStackAtom);
    const next = stack.length >= HISTORY_LIMIT ? stack.slice(1) : stack.slice();
    next.push(snapshot);
    set(undoStackAtom, next);
    set(redoStackAtom, []);
    set(lastPushAtom, { tag: options?.tag, ts: now });
  },
);

export const undoAtom = atom(null, (get, set) => {
  const undoStack = get(undoStackAtom);
  if (undoStack.length === 0) return;
  const previous = undoStack[undoStack.length - 1];
  const current = get(deckAtom);
  set(undoStackAtom, undoStack.slice(0, -1));
  set(redoStackAtom, [...get(redoStackAtom), current]);
  set(deckAtom, previous);
  set(lastPushAtom, null);
});

export const redoAtom = atom(null, (get, set) => {
  const redoStack = get(redoStackAtom);
  if (redoStack.length === 0) return;
  const next = redoStack[redoStack.length - 1];
  const current = get(deckAtom);
  set(redoStackAtom, redoStack.slice(0, -1));
  set(undoStackAtom, [...get(undoStackAtom), current]);
  set(deckAtom, next);
  set(lastPushAtom, null);
});
