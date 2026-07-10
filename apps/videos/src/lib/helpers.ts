import { Easing, interpolate } from "remotion";

/** Opacity ramp starting at `start`, over `dur` frames. */
export const fadeIn = (frame: number, start: number, dur = 6) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Fade + slight upward drift, for log lines and cards. */
export const riseIn = (frame: number, start: number, dur = 8) => ({
  opacity: fadeIn(frame, start, dur),
  transform: `translateY(${interpolate(frame, [start, start + dur], [6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })}px)`,
});

/**
 * Deterministic typewriter: how many characters of `text` are visible at
 * `frame`, typing at `cps` characters per second. Replaces the original
 * setTimeout(40 + Math.random() * 50) loops with a frame-driven equivalent.
 */
export const typedChars = (
  frame: number,
  start: number,
  text: string,
  fps: number,
  cps: number,
) => {
  const chars = Math.floor(((frame - start) / fps) * cps);
  return Math.max(0, Math.min(text.length, chars));
};

/** Frames needed to fully type `text` at `cps`. */
export const typingDuration = (text: string, fps: number, cps: number) =>
  Math.ceil((text.length / cps) * fps);

/** Blinking caret opacity (~0.6s cycle, like the original CSS pulse). */
export const caretBlink = (frame: number, fps: number) =>
  Math.floor(frame / (fps * 0.3)) % 2 === 0 ? 1 : 0.15;

/** Continuous spinner rotation in degrees (one turn per second). */
export const spinnerRotation = (frame: number, fps: number) =>
  ((frame % fps) / fps) * 360;
