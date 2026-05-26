import type { CSSProperties, ReactNode } from "react";

export function DomElementLayer({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden="true" style={layerStyle}>
      {children}
    </div>
  );
}

const layerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 2,
  overflow: "hidden",
  pointerEvents: "none",
};
