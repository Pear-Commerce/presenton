const SAFE_EMPTY_SVG =
  '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"></svg>';

const BLOCKED_TAGS = new Set([
  "script",
  "foreignobject",
  "iframe",
  "object",
  "embed",
  "image",
  "video",
  "audio",
  "canvas",
  "link",
  "meta",
  "base",
  "style",
  "animate",
  "animatemotion",
  "animatetransform",
  "set",
]);

type SanitizeOptions = {
  throwOnInvalid?: boolean;
};

export function sanitizeSvgMarkup(
  svg: string,
  options: SanitizeOptions = {},
): string {
  try {
    const extracted = extractSvg(svg);
    if (!extracted) throw new Error("SVG markup must contain one <svg> root.");
    const sanitized =
      typeof DOMParser !== "undefined" && typeof XMLSerializer !== "undefined"
        ? sanitizeWithDomParser(extracted)
        : sanitizeWithStringRules(extracted);
    if (!/^<svg[\s>]/i.test(sanitized)) {
      throw new Error("Sanitized markup is not an SVG.");
    }
    return sanitized;
  } catch (error) {
    if (options.throwOnInvalid) {
      throw error instanceof Error ? error : new Error("Invalid SVG markup.");
    }
    return SAFE_EMPTY_SVG;
  }
}

function extractSvg(svg: string): string | null {
  const trimmed = svg
    .replace(/```(?:svg)?/gi, "")
    .replace(/```/g, "")
    .replace(/<\?xml[^>]*>/gi, "")
    .replace(/<!doctype[\s\S]*?>/gi, "")
    .trim();
  return trimmed.match(/<svg[\s\S]*<\/svg>/i)?.[0] ?? null;
}

function sanitizeWithDomParser(svg: string): string {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("SVG markup could not be parsed.");
  }
  const root = doc.documentElement;
  if (root.tagName.toLowerCase() !== "svg") {
    throw new Error("SVG markup must contain one <svg> root.");
  }
  sanitizeNode(root);
  return new XMLSerializer().serializeToString(root);
}

function sanitizeNode(element: Element): void {
  for (const child of [...element.children]) {
    if (BLOCKED_TAGS.has(child.tagName.toLowerCase())) {
      child.remove();
      continue;
    }
    sanitizeNode(child);
  }

  for (const attr of [...element.attributes]) {
    const name = attr.name.toLowerCase();
    const value = attr.value.trim();
    if (name.startsWith("on")) {
      element.removeAttribute(attr.name);
      continue;
    }
    if ((name === "href" || name === "xlink:href") && !value.startsWith("#")) {
      element.removeAttribute(attr.name);
      continue;
    }
    if (name === "src") {
      element.removeAttribute(attr.name);
      continue;
    }
    if (name === "style" && unsafeStyle(value)) {
      element.removeAttribute(attr.name);
    }
  }
}

function sanitizeWithStringRules(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<animate(?:Motion|Transform)?[\s\S]*?\/?>/gi, "")
    .replace(/<set[\s\S]*?\/?>/gi, "")
    .replace(/<(?:iframe|object|embed|image|video|audio|canvas|link|meta|base)\b[\s\S]*?\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /\s(?:href|xlink:href)\s*=\s*(?:"(?!#)[^"]*"|'(?!#)[^']*'|(?!#)[^\s>]+)/gi,
      "",
    )
    .replace(/\ssrc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\sstyle\s*=\s*(?:"[^"]*(?:url\s*\(|expression\s*\(|javascript:|@import)[^"]*"|'[^']*(?:url\s*\(|expression\s*\(|javascript:|@import)[^']*')/gi, "");
}

function unsafeStyle(value: string): boolean {
  return /url\s*\(|expression\s*\(|javascript:|@import/i.test(value);
}
