import screenfull from "screenfull";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SLIDE_H, SLIDE_W, type Deck } from "./lib/slide-schema";
import { presentStyles } from "./presentationStyles";
import { KonvaSlide } from "./slide-surface";

const SLIDE_ASPECT = SLIDE_W / SLIDE_H;

export function PresentationMode({
  deck,
  startIndex = 0,
  onClose,
}: {
  deck: Deck;
  startIndex?: number;
  onClose: () => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(startIndex, 0), Math.max(deck.slides.length - 1, 0)),
  );
  const [fit, setFit] = useState({ width: 0, height: 0 });
  const [hintsVisible, setHintsVisible] = useState(true);

  useLayoutEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const measure = () => {
      const { clientWidth, clientHeight } = node;
      if (!clientWidth || !clientHeight) return;
      const byWidth = {
        width: clientWidth,
        height: clientWidth / SLIDE_ASPECT,
      };
      const next =
        byWidth.height <= clientHeight
          ? byWidth
          : { width: clientHeight * SLIDE_ASPECT, height: clientHeight };
      setFit(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || !screenfull.isEnabled) return;
    screenfull.request(node).catch(() => {});
    const handleChange = () => {
      if (!screenfull.isFullscreen) onClose();
    };
    screenfull.on("change", handleChange);
    return () => {
      screenfull.off("change", handleChange);
      if (screenfull.isFullscreen) screenfull.exit().catch(() => {});
    };
  }, [onClose]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (
        event.key === "ArrowRight" ||
        event.key === "PageDown" ||
        event.key === " "
      ) {
        event.preventDefault();
        setIndex((current) => Math.min(current + 1, deck.slides.length - 1));
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        setIndex((current) => Math.max(current - 1, 0));
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        setIndex(0);
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        setIndex(deck.slides.length - 1);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [deck.slides.length, onClose]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const showThenHide = () => {
      setHintsVisible(true);
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => setHintsVisible(false), 1800);
    };
    showThenHide();
    window.addEventListener("mousemove", showThenHide);
    return () => {
      window.removeEventListener("mousemove", showThenHide);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const slide = deck.slides[index];
  const total = deck.slides.length;

  return (
    <div ref={rootRef} style={presentStyles.root}>
      {slide && fit.width > 0 ? (
        <div
          style={{
            ...presentStyles.stageWrap,
            width: fit.width,
            height: fit.height,
          }}
        >
          <KonvaSlide
            slide={slide}
            width={fit.width}
            height={fit.height}
            interactive={false}
          />
        </div>
      ) : null}

      <div
        style={{
          ...presentStyles.controls,
          opacity: hintsVisible ? 1 : 0,
          pointerEvents: hintsVisible ? "auto" : "none",
        }}
      >
        <button
          type="button"
          style={presentStyles.controlButton}
          onClick={() => setIndex((current) => Math.max(current - 1, 0))}
          disabled={index === 0}
          aria-label="Previous slide"
        >
          ‹
        </button>
        <div style={presentStyles.counter}>
          {index + 1} / {total}
        </div>
        <button
          type="button"
          style={presentStyles.controlButton}
          onClick={() =>
            setIndex((current) => Math.min(current + 1, total - 1))
          }
          disabled={index === total - 1}
          aria-label="Next slide"
        >
          ›
        </button>
        <button
          type="button"
          style={{
            ...presentStyles.controlButton,
            ...presentStyles.exitButton,
          }}
          onClick={onClose}
          aria-label="Exit presentation"
        >
          Esc
        </button>
      </div>
    </div>
  );
}
