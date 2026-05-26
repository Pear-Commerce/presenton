import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation, useSortable } from "@dnd-kit/react/sortable";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import type { KeyboardEvent } from "react";
import type { Slide } from "../lib/slide-schema";
import { KonvaSlide } from "../slide-surface";
import {
  activeSlideIndexAtom,
  deckAtom,
  moveSlideAtom,
  setSelectionAtom,
  updateDeckTitleAtom,
} from "../state";
import { editorTheme } from "../editorStyles";
import { layoutStyles } from "./layoutStyles";

const SLIDE_SORTABLE_GROUP = "slide-thumbnails";

const slideIdMap = new WeakMap<Slide, string>();
let nextSlideId = 0;
function getSlideId(slide: Slide): string {
  let id = slideIdMap.get(slide);
  if (!id) {
    id = `slide-${nextSlideId++}`;
    slideIdMap.set(slide, id);
  }
  return id;
}

export function ThumbnailRail() {
  const deck = useAtomValue(deckAtom);
  const [active, setActive] = useAtom(activeSlideIndexAtom);
  const setSelection = useSetAtom(setSelectionAtom);
  const updateDeckTitle = useSetAtom(updateDeckTitleAtom);
  const moveSlide = useSetAtom(moveSlideAtom);

  const selectSlide = (index: number) => {
    setActive(index);
    setSelection(-1);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.canceled || !isSortableOperation(event.operation)) return;
    const source = event.operation.source;
    if (!source) return;
    const from = deck.slides.findIndex(
      (slide: any) => getSlideId(slide) === source.id,
    );
    const to = source.index;
    if (
      from < 0 ||
      typeof to !== "number" ||
      to < 0 ||
      to >= deck.slides.length ||
      from === to
    ) {
      return;
    }
    moveSlide({ from, to });
  };

  return (
    <aside style={layoutStyles.sidebar}>
      <div style={layoutStyles.header}>
        <input
          aria-label="Deck title"
          value={deck.title}
          onChange={(event) => updateDeckTitle(event.target.value)}
          style={layoutStyles.titleInput}
        />
        <div style={layoutStyles.meta}>{deck.slides.length} slides</div>
      </div>

      <DragDropProvider onDragEnd={handleDragEnd}>
        <div style={layoutStyles.thumbs}>
          {deck.slides.map((slide: any, index: number) => {
            const id = getSlideId(slide);
            return (
              <SortableSlideThumbnail
                key={id}
                id={id}
                slide={slide}
                index={index}
                active={index === active}
                onSelect={selectSlide}
              />
            );
          })}
        </div>
      </DragDropProvider>
    </aside>
  );
}

function SortableSlideThumbnail({
  id,
  slide,
  index,
  active,
  onSelect,
}: {
  id: string;
  slide: Slide;
  index: number;
  active: boolean;
  onSelect: (index: number) => void;
}) {
  const { ref, handleRef, isDragSource, isDropTarget } = useSortable({
    id,
    index,
    group: SLIDE_SORTABLE_GROUP,
    type: "slide",
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect(index);
  };

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={`Slide ${index + 1}`}
      onClick={() => onSelect(index)}
      onKeyDown={handleKeyDown}
      style={{
        ...layoutStyles.thumbRow,
        borderColor: isDropTarget
          ? "#4791FF"
          : active
            ? editorTheme.primary
            : editorTheme.border,
        boxShadow: active
          ? `0 0 0 1px ${editorTheme.primary} inset, 0 10px 24px rgba(124,81,248,0.12)`
          : layoutStyles.thumbRow.boxShadow,
        opacity: isDragSource ? 0.55 : 1,
      }}
    >
      <span style={layoutStyles.thumbNumber}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <KonvaSlide slide={slide} width={160} height={90} interactive={false} />
      <span
        ref={handleRef}
        aria-label={`Drag slide ${index + 1}`}
        title="Drag slide"
        style={layoutStyles.thumbDragHandle}
        onClick={(event) => event.stopPropagation()}
      >
        ::
      </span>
    </div>
  );
}
