import { Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

import { caretBlink, fadeIn, riseIn, typedChars, typingDuration } from "../lib/helpers";
import { AvatarTommy } from "../lib/icons";
import { FULL_CONTENT_DELAY, Stage, type StageLayout } from "../lib/stage";

/*
 * Port of apps/docs/.../assistant-demo.tsx, choreographed as a conversation:
 * the chat bar shows first, the question is typed into it, submit pops the
 * message bubble, the assistant's reply streams in, then the results stagger.
 */

// The light/dark messages must stay the same length: the typing marks are
// module-level constants, computed once from the light variant.
const MESSAGE_LIGHT = "Find me a white sneaker under $120";
const MESSAGE_DARK = "Find me a black sneaker under $120";
const INTRO = "I have found some options for you:";

const FPS = 30;
const CPS = 16;
const INTRO_CPS = 30;

const T = {
  input: 6,
  type: 24,
};

const typeEnd = T.type + typingDuration(MESSAGE_LIGHT, FPS, CPS);
const press = typeEnd + 8;
const submit = press + 6;
const intro = submit + 18;
const introEnd = intro + typingDuration(INTRO, FPS, INTRO_CPS);
const cards = introEnd + 10;
const CARD_STAGGER = 7;

export const ASSISTANT_DURATION = cards + 3 * CARD_STAGGER + 90;

const shoes = [
  { name: "Running", price: "$95", image: "sneakers/sneaker-1" },
  { name: "Street", price: "$88", image: "sneakers/sneaker-2" },
  { name: "Running", price: "$72", image: "sneakers/sneaker-3" },
  { name: "Sport", price: "$60", image: "sneakers/sneaker-4" },
];

export const AssistantComposition = ({
  kicker = "Vercel Shop · AI Assistant",
  title = "A shopping assistant, built into the template",
  layout = "split",
  theme = "light",
}: {
  kicker?: string;
  title?: string;
  layout?: StageLayout;
  theme?: "light" | "dark";
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame() - (layout === "full" ? FULL_CONTENT_DELAY : 0);

  const message = theme === "dark" ? MESSAGE_DARK : MESSAGE_LIGHT;
  const chars = typedChars(frame, T.type, message, fps, CPS);
  const isTyping = frame >= T.type && chars < message.length;
  const isPressing = frame >= press && frame < submit;
  const introChars = typedChars(frame, intro, INTRO, fps, INTRO_CPS);

  const bubble = spring({
    frame: frame - submit,
    fps,
    config: { damping: 16, stiffness: 220 },
    durationInFrames: 16,
  });

  return (
    <Stage kicker={kicker} layout={layout} theme={theme} title={title} width={620}>
      <div className="w-full rounded-xl border border-gray-alpha-400 bg-background-100 p-4">
        <div className="flex flex-col gap-6">
          {/* User message — pops in on submit; a fixed-height slot so the
              layout doesn't jump while the question is still being typed */}
          <div
            className="flex h-[72px] flex-col items-end gap-2"
            style={{
              opacity: frame >= submit ? bubble : 0,
              transform: `scale(${0.92 + bubble * 0.08})`,
              transformOrigin: "top right",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-foreground">Tommy Triangle</span>
              <AvatarTommy className="size-5 rounded-full" />
            </div>
            <div className="relative rounded-2xl bg-gray-100 px-4 py-2 text-sm text-foreground">
              {message}
              <svg
                aria-hidden
                className="absolute -top-[7px] left-full -ml-3.5 text-gray-100"
                fill="currentColor"
                height="16"
                viewBox="0 0 15 16"
                width="15"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M-0.00028528 7C7.033 7.10168 11.1622 3.97537 13.9997 -9.98928e-06C14.9997 5.50001 13.9997 12 12.4997 16L-0.00028528 7Z" />
              </svg>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {/* Assistant reply streams in */}
            <div className="h-5 text-sm text-foreground">
              {frame >= intro && INTRO.slice(0, introChars)}
            </div>

            {/* Product grid */}
            <div className="grid grid-cols-4 gap-3">
              {shoes.map((shoe, i) => (
                <div
                  className="flex flex-col gap-3 rounded-lg border border-gray-300 p-3"
                  key={`${shoe.name}-${i}`}
                  style={riseIn(frame, cards + i * CARD_STAGGER, 10)}
                >
                  <div className="relative h-20 w-full overflow-hidden">
                    <Img
                      className="absolute inset-0 h-full w-full object-contain"
                      src={staticFile(`${shoe.image}${theme === "dark" ? "-dark" : ""}.png`)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground">{shoe.name}</span>
                    <span className="text-xs text-gray-800">{shoe.price}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Input — the question is typed here, then it clears on submit */}
            <div
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-background-200 p-2.5"
              style={{ opacity: fadeIn(frame, T.input) }}
            >
              <span className="text-sm">
                {frame < submit && chars > 0 ? (
                  <span className="text-foreground">{message.slice(0, chars)}</span>
                ) : (
                  <span className="text-gray-600">Ask anything…</span>
                )}
                <span
                  aria-hidden
                  className="ml-0.5 inline-block h-4 w-[5px] bg-foreground/70 align-middle"
                  style={{ opacity: isTyping ? caretBlink(frame, fps) : 0 }}
                />
              </span>
              <button
                aria-label="Send"
                className="flex size-7 items-center justify-center rounded-md bg-gray-500 text-background-200"
                style={{ transform: `scale(${isPressing ? 0.85 : 1})` }}
                type="button"
              >
                <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
};
