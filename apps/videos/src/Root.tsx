import { Composition } from "remotion";

import "./lib/fonts";
import "./style.css";

import { AgentComposition, agentDuration, agentSkills } from "./compositions/agent";
import { AssistantComposition, ASSISTANT_DURATION } from "./compositions/assistant";
import { CartComposition, CART_DURATION } from "./compositions/cart";
import {
  CONTENT_NEGOTIATION_DURATION,
  ContentNegotiationComposition,
} from "./compositions/content-negotiation";
import { SHOWREEL_DURATION, ShowreelComposition } from "./compositions/showreel";

const size = { width: 1920, height: 1080, fps: 30 } as const;

export const RemotionRoot = () => (
  <>
    <Composition
      component={ShowreelComposition}
      defaultProps={{ layout: "split" as const }}
      durationInFrames={SHOWREEL_DURATION}
      id="Showreel"
      {...size}
    />
    <Composition
      component={CartComposition}
      defaultProps={{ layout: "split" as const }}
      durationInFrames={CART_DURATION}
      id="Cart"
      {...size}
    />
    <Composition
      component={AgentComposition}
      defaultProps={{ skillKey: "markets", layout: "split" as const }}
      durationInFrames={agentDuration(agentSkills.markets!)}
      id="AgentMarkets"
      {...size}
    />
    <Composition
      component={AgentComposition}
      defaultProps={{ skillKey: "auth", layout: "split" as const }}
      durationInFrames={agentDuration(agentSkills.auth!)}
      id="AgentAuth"
      {...size}
    />
    <Composition
      component={AgentComposition}
      defaultProps={{ skillKey: "cms", layout: "split" as const }}
      durationInFrames={agentDuration(agentSkills.cms!)}
      id="AgentCMS"
      {...size}
    />
    <Composition
      component={ContentNegotiationComposition}
      defaultProps={{ layout: "split" as const }}
      durationInFrames={CONTENT_NEGOTIATION_DURATION}
      id="ContentNegotiation"
      {...size}
    />
    <Composition
      component={AssistantComposition}
      defaultProps={{ layout: "split" as const }}
      durationInFrames={ASSISTANT_DURATION}
      id="Assistant"
      {...size}
    />
  </>
);
