import { SlideEditor } from "@/components/slide-editor";
import { neoGeneralDeck } from "@/components/slide-editor/templates";

export default function Experimental() {
  return <SlideEditor key={1} initialDeck={neoGeneralDeck} />;
}
