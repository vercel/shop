export type ToneId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

// Tailwind's scanner can't see `bg-layer-${tone}` template strings, so every layer class
// is written out literally here and referenced by key.
export interface ToneClasses {
  bg: string;
  divider: string;
  fg: string;
  hoverLink: string;
  inputBorder: string;
  pillBorder: string;
  pillHover: string;
  solidButton: string;
  subtle: string;
  tileBg: string;
  tileHoverBg: string;
}

export const TONES: Record<ToneId, ToneClasses> = {
  1: {
    bg: "bg-layer-1",
    divider: "bg-layer-1",
    fg: "text-layer-1-foreground",
    hoverLink: "text-layer-1-subtle hover:text-layer-1-foreground",
    inputBorder:
      "border-layer-1-foreground/30 placeholder:text-layer-1-subtle focus:border-layer-1-foreground",
    pillBorder: "border-layer-1-foreground/25",
    pillHover: "hover:bg-layer-1-foreground hover:text-layer-1",
    solidButton: "bg-layer-1-foreground text-layer-1 hover:bg-layer-1-foreground/85",
    subtle: "text-layer-1-subtle",
    tileBg: "bg-layer-1",
    tileHoverBg: "hover:bg-layer-1-foreground/5",
  },
  2: {
    bg: "bg-layer-2",
    divider: "bg-layer-2",
    fg: "text-layer-2-foreground",
    hoverLink: "text-layer-2-subtle hover:text-layer-2-foreground",
    inputBorder:
      "border-layer-2-foreground/30 placeholder:text-layer-2-subtle focus:border-layer-2-foreground",
    pillBorder: "border-layer-2-foreground/25",
    pillHover: "hover:bg-layer-2-foreground hover:text-layer-2",
    solidButton: "bg-layer-2-foreground text-layer-2 hover:bg-layer-2-foreground/85",
    subtle: "text-layer-2-subtle",
    tileBg: "bg-layer-2",
    tileHoverBg: "hover:bg-layer-2-foreground/5",
  },
  3: {
    bg: "bg-layer-3",
    divider: "bg-layer-3",
    fg: "text-layer-3-foreground",
    hoverLink: "text-layer-3-subtle hover:text-layer-3-foreground",
    inputBorder:
      "border-layer-3-foreground/30 placeholder:text-layer-3-subtle focus:border-layer-3-foreground",
    pillBorder: "border-layer-3-foreground/25",
    pillHover: "hover:bg-layer-3-foreground hover:text-layer-3",
    solidButton: "bg-layer-3-foreground text-layer-3 hover:bg-layer-3-foreground/85",
    subtle: "text-layer-3-subtle",
    tileBg: "bg-layer-3",
    tileHoverBg: "hover:bg-layer-3-foreground/5",
  },
  4: {
    bg: "bg-layer-4",
    divider: "bg-layer-4",
    fg: "text-layer-4-foreground",
    hoverLink: "text-layer-4-subtle hover:text-layer-4-foreground",
    inputBorder:
      "border-layer-4-foreground/30 placeholder:text-layer-4-subtle focus:border-layer-4-foreground",
    pillBorder: "border-layer-4-foreground/25",
    pillHover: "hover:bg-layer-4-foreground hover:text-layer-4",
    solidButton: "bg-layer-4-foreground text-layer-4 hover:bg-layer-4-foreground/85",
    subtle: "text-layer-4-subtle",
    tileBg: "bg-layer-4",
    tileHoverBg: "hover:bg-layer-4-foreground/5",
  },
  5: {
    bg: "bg-layer-5",
    divider: "bg-layer-5",
    fg: "text-layer-5-foreground",
    hoverLink: "text-layer-5-subtle hover:text-layer-5-foreground",
    inputBorder:
      "border-layer-5-foreground/30 placeholder:text-layer-5-subtle focus:border-layer-5-foreground",
    pillBorder: "border-layer-5-foreground/25",
    pillHover: "hover:bg-layer-5-foreground hover:text-layer-5",
    solidButton: "bg-layer-5-foreground text-layer-5 hover:bg-layer-5-foreground/85",
    subtle: "text-layer-5-subtle",
    tileBg: "bg-layer-5",
    tileHoverBg: "hover:bg-layer-5-foreground/5",
  },
  6: {
    bg: "bg-layer-6",
    divider: "bg-layer-6",
    fg: "text-layer-6-foreground",
    hoverLink: "text-layer-6-subtle hover:text-layer-6-foreground",
    inputBorder:
      "border-layer-6-foreground/30 placeholder:text-layer-6-subtle focus:border-layer-6-foreground",
    pillBorder: "border-layer-6-foreground/25",
    pillHover: "hover:bg-layer-6-foreground hover:text-layer-6",
    solidButton: "bg-layer-6-foreground text-layer-6 hover:bg-layer-6-foreground/85",
    subtle: "text-layer-6-subtle",
    tileBg: "bg-layer-6",
    tileHoverBg: "hover:bg-layer-6-foreground/5",
  },
  7: {
    bg: "bg-layer-7",
    divider: "bg-layer-7",
    fg: "text-layer-7-foreground",
    hoverLink: "text-layer-7-subtle hover:text-layer-7-foreground",
    inputBorder:
      "border-layer-7-foreground/30 placeholder:text-layer-7-subtle focus:border-layer-7-foreground",
    pillBorder: "border-layer-7-foreground/25",
    pillHover: "hover:bg-layer-7-foreground hover:text-layer-7",
    solidButton: "bg-layer-7-foreground text-layer-7 hover:bg-layer-7-foreground/85",
    subtle: "text-layer-7-subtle",
    tileBg: "bg-layer-7",
    tileHoverBg: "hover:bg-layer-7-foreground/5",
  },
  8: {
    bg: "bg-layer-8",
    divider: "bg-layer-8",
    fg: "text-layer-8-foreground",
    hoverLink: "text-layer-8-subtle hover:text-layer-8-foreground",
    inputBorder:
      "border-layer-8-foreground/30 placeholder:text-layer-8-subtle focus:border-layer-8-foreground",
    pillBorder: "border-layer-8-foreground/25",
    pillHover: "hover:bg-layer-8-foreground hover:text-layer-8",
    solidButton: "bg-layer-8-foreground text-layer-8 hover:bg-layer-8-foreground/85",
    subtle: "text-layer-8-subtle",
    tileBg: "bg-layer-8",
    tileHoverBg: "hover:bg-layer-8-foreground/5",
  },
  9: {
    bg: "bg-layer-9",
    divider: "bg-layer-9",
    fg: "text-layer-9-foreground",
    hoverLink: "text-layer-9-subtle hover:text-layer-9-foreground",
    inputBorder:
      "border-layer-9-foreground/30 placeholder:text-layer-9-subtle focus:border-layer-9-foreground",
    pillBorder: "border-layer-9-foreground/25",
    pillHover: "hover:bg-layer-9-foreground hover:text-layer-9",
    solidButton: "bg-layer-9-foreground text-layer-9 hover:bg-layer-9-foreground/85",
    subtle: "text-layer-9-subtle",
    tileBg: "bg-layer-9",
    tileHoverBg: "hover:bg-layer-9-foreground/5",
  },
  10: {
    bg: "bg-layer-10",
    divider: "bg-layer-10",
    fg: "text-layer-10-foreground",
    hoverLink: "text-layer-10-subtle hover:text-layer-10-foreground",
    inputBorder:
      "border-layer-10-foreground/30 placeholder:text-layer-10-subtle focus:border-layer-10-foreground",
    pillBorder: "border-layer-10-foreground/25",
    pillHover: "hover:bg-layer-10-foreground hover:text-layer-10",
    solidButton: "bg-layer-10-foreground text-layer-10 hover:bg-layer-10-foreground/85",
    subtle: "text-layer-10-subtle",
    tileBg: "bg-layer-10",
    tileHoverBg: "hover:bg-layer-10-foreground/5",
  },
  11: {
    bg: "bg-layer-11",
    divider: "bg-layer-11",
    fg: "text-layer-11-foreground",
    hoverLink: "text-layer-11-subtle hover:text-layer-11-foreground",
    inputBorder:
      "border-layer-11-foreground/30 placeholder:text-layer-11-subtle focus:border-layer-11-foreground",
    pillBorder: "border-layer-11-foreground/25",
    pillHover: "hover:bg-layer-11-foreground hover:text-layer-11",
    solidButton: "bg-layer-11-foreground text-layer-11 hover:bg-layer-11-foreground/85",
    subtle: "text-layer-11-subtle",
    tileBg: "bg-layer-11",
    tileHoverBg: "hover:bg-layer-11-foreground/5",
  },
  12: {
    bg: "bg-layer-12",
    divider: "bg-layer-12",
    fg: "text-layer-12-foreground",
    hoverLink: "text-layer-12-subtle hover:text-layer-12-foreground",
    inputBorder:
      "border-layer-12-foreground/30 placeholder:text-layer-12-subtle focus:border-layer-12-foreground",
    pillBorder: "border-layer-12-foreground/25",
    pillHover: "hover:bg-layer-12-foreground hover:text-layer-12",
    solidButton: "bg-layer-12-foreground text-layer-12 hover:bg-layer-12-foreground/85",
    subtle: "text-layer-12-subtle",
    tileBg: "bg-layer-12",
    tileHoverBg: "hover:bg-layer-12-foreground/5",
  },
  13: {
    bg: "bg-layer-13",
    divider: "bg-layer-13",
    fg: "text-layer-13-foreground",
    hoverLink: "text-layer-13-subtle hover:text-layer-13-foreground",
    inputBorder:
      "border-layer-13-foreground/30 placeholder:text-layer-13-subtle focus:border-layer-13-foreground",
    pillBorder: "border-layer-13-foreground/25",
    pillHover: "hover:bg-layer-13-foreground hover:text-layer-13",
    solidButton: "bg-layer-13-foreground text-layer-13 hover:bg-layer-13-foreground/85",
    subtle: "text-layer-13-subtle",
    tileBg: "bg-layer-13",
    tileHoverBg: "hover:bg-layer-13-foreground/5",
  },
  14: {
    bg: "bg-layer-14",
    divider: "bg-layer-14",
    fg: "text-layer-14-foreground",
    hoverLink: "text-layer-14-subtle hover:text-layer-14-foreground",
    inputBorder:
      "border-layer-14-foreground/30 placeholder:text-layer-14-subtle focus:border-layer-14-foreground",
    pillBorder: "border-layer-14-foreground/25",
    pillHover: "hover:bg-layer-14-foreground hover:text-layer-14",
    solidButton: "bg-layer-14-foreground text-layer-14 hover:bg-layer-14-foreground/85",
    subtle: "text-layer-14-subtle",
    tileBg: "bg-layer-14",
    tileHoverBg: "hover:bg-layer-14-foreground/5",
  },
};
