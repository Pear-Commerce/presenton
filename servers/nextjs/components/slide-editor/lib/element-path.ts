import type { Slide, SlideElement } from "./slide-schema";

export type ElementPath = string;

type ParentRef =
  | { kind: "root"; elements: SlideElement[]; index: number }
  | {
      kind: "children";
      parent: Extract<SlideElement, { children: SlideElement[] }>;
      index: number;
    }
  | { kind: "child"; parent: Extract<SlideElement, { type: "container" }> }
  | {
      kind: "item";
      parent: Extract<SlideElement, { type: "list-view" | "grid-view" }>;
    };

export function rootIndexFromPath(path: ElementPath | null | undefined) {
  if (!path) return -1;
  const root = Number(path.split(".")[0]);
  return Number.isInteger(root) && root >= 0 ? root : -1;
}

export function rootPath(index: number): ElementPath {
  return String(index);
}

export function isRootPath(path: ElementPath | null | undefined) {
  if (!path) return false;
  return path === String(rootIndexFromPath(path));
}

export function getElementAtPath(
  slide: Slide,
  path: ElementPath | null | undefined,
): SlideElement | null {
  const ref = getElementRef(slide, path);
  if (!ref) return null;
  if (ref.kind === "root") return ref.elements[ref.index] ?? null;
  if (ref.kind === "children") return ref.parent.children[ref.index] ?? null;
  if (ref.kind === "child") return ref.parent.child ?? null;
  return ref.parent.item ?? null;
}

export function setElementAtPath(
  slide: Slide,
  path: ElementPath,
  element: SlideElement,
): boolean {
  const ref = getElementRef(slide, path);
  if (!ref) return false;
  if (ref.kind === "root") {
    ref.elements[ref.index] = element;
    return true;
  }
  if (ref.kind === "children") {
    ref.parent.children[ref.index] = element;
    return true;
  }
  if (ref.kind === "child") {
    ref.parent.child = element;
    return true;
  }
  ref.parent.item = element;
  return true;
}

export function patchElementAtPath(
  slide: Slide,
  path: ElementPath,
  patch: Partial<SlideElement>,
): boolean {
  const element = getElementAtPath(slide, path);
  if (!element) return false;
  return setElementAtPath(slide, path, {
    ...element,
    ...patch,
  } as SlideElement);
}

export function deleteElementAtPath(slide: Slide, path: ElementPath): boolean {
  const ref = getElementRef(slide, path);
  if (!ref) return false;
  if (ref.kind === "root") {
    ref.elements.splice(ref.index, 1);
    return true;
  }
  if (ref.kind === "children") {
    ref.parent.children.splice(ref.index, 1);
    return true;
  }
  if (ref.kind === "child") {
    ref.parent.child = null;
    return true;
  }
  return false;
}

export function duplicateElementAtPath(
  slide: Slide,
  path: ElementPath,
  clone: (element: SlideElement) => SlideElement,
): ElementPath | null {
  const ref = getElementRef(slide, path);
  const element = getElementAtPath(slide, path);
  if (!ref || !element) return null;
  const copy = clone(element);
  if (ref.kind === "root") {
    ref.elements.splice(ref.index + 1, 0, copy);
    return rootPath(ref.index + 1);
  }
  if (ref.kind === "children") {
    ref.parent.children.splice(ref.index + 1, 0, copy);
    return `${parentPath(path)}.${ref.index + 1}`;
  }
  return null;
}

export function parentPath(path: ElementPath): ElementPath {
  const parts = path.split(".");
  if (parts.length <= 1) return path;
  if (parts.at(-2) === "children" || parts.at(-2) === "item") {
    return parts.slice(0, -2).join(".");
  }
  return parts.slice(0, -1).join(".");
}

function getElementRef(
  slide: Slide,
  path: ElementPath | null | undefined,
): ParentRef | null {
  if (!path) return null;
  const parts = path.split(".");
  const rootIndex = Number(parts[0]);
  if (!Number.isInteger(rootIndex) || rootIndex < 0) return null;
  let current: SlideElement | null = slide.elements[rootIndex] ?? null;
  if (!current) return null;
  if (parts.length === 1) {
    return { kind: "root", elements: slide.elements, index: rootIndex };
  }

  for (let i = 1; i < parts.length; i += 1) {
    const part = parts[i];
    const isLeaf = i === parts.length - 1;

    if (part === "children") {
      const index = Number(parts[i + 1]);
      if (!hasChildren(current) || !Number.isInteger(index) || index < 0) {
        return null;
      }
      if (isLeaf || i + 1 === parts.length - 1) {
        return { kind: "children", parent: current, index };
      }
      current = current.children[index];
      if (!current) return null;
      i += 1;
      continue;
    }

    if (part === "child") {
      if (current.type !== "container") return null;
      if (isLeaf) return { kind: "child", parent: current };
      current = current.child ?? null;
      if (!current) return null;
      continue;
    }

    if (part === "item") {
      if (current.type !== "list-view" && current.type !== "grid-view") {
        return null;
      }
      if (isLeaf || Number.isInteger(Number(parts[i + 1]))) {
        return { kind: "item", parent: current };
      }
      current = current.item;
      continue;
    }
  }

  return null;
}

function hasChildren(
  element: SlideElement,
): element is Extract<SlideElement, { children: SlideElement[] }> {
  return (
    element.type === "flex" ||
    element.type === "grid" ||
    element.type === "group"
  );
}
