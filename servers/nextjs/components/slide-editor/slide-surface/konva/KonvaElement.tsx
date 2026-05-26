import { renderKonvaElement, type KonvaElementRenderProps } from "./elementRenderers";

export function KonvaElement(props: KonvaElementRenderProps) {
  return renderKonvaElement(props);
}
