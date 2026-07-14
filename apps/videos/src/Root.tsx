import { Composition } from "remotion";
import { z } from "zod";

import "./lib/fonts";
import "./style.css";

import { AgentComposition, agentDuration, agentSkills } from "./compositions/agent";
import { AGENT_MARKETS_DURATION, AgentMarketsComposition } from "./compositions/agent-markets";
import { AssistantComposition, ASSISTANT_DURATION } from "./compositions/assistant";
import { CartComposition, CART_DURATION } from "./compositions/cart";
import {
  CONTENT_NEGOTIATION_DURATION,
  ContentNegotiationComposition,
} from "./compositions/content-negotiation";
import { SHOWREEL_DURATION, ShowreelComposition } from "./compositions/showreel";
import { TRANSFORMATION_DURATION, TransformationComposition } from "./compositions/transformation";
import { UPDATE_SHOP_DURATION, UpdateShopComposition } from "./compositions/update-shop";

const size = { width: 1920, height: 1080, fps: 30 } as const;

// Zod schemas give the studio real controls (dropdowns for layout/theme)
// instead of the raw JSON props editor.
const layoutSchema = z.object({
  layout: z.enum(["split", "full"]),
  theme: z.enum(["light", "dark"]),
});

const agentSchema = layoutSchema.extend({
  skillKey: z.enum(["auth", "cms"]),
});

export const RemotionRoot = () => (
  <>
    <Composition
      component={ShowreelComposition}
      defaultProps={{ layout: "split" as const, theme: "light" as const }}
      durationInFrames={SHOWREEL_DURATION}
      id="Showreel"
      schema={layoutSchema}
      {...size}
    />
    <Composition
      component={CartComposition}
      defaultProps={{ layout: "split" as const, theme: "light" as const }}
      durationInFrames={CART_DURATION}
      id="Cart"
      schema={layoutSchema}
      {...size}
    />
    <Composition
      component={AgentMarketsComposition}
      defaultProps={{ layout: "full" as const, theme: "dark" as const }}
      durationInFrames={AGENT_MARKETS_DURATION}
      id="AgentMarkets"
      schema={layoutSchema}
      {...size}
    />
    <Composition
      component={UpdateShopComposition}
      defaultProps={{ layout: "full" as const, theme: "dark" as const }}
      durationInFrames={UPDATE_SHOP_DURATION}
      id="AgentUpdateShop"
      schema={layoutSchema}
      {...size}
    />
    <Composition
      component={AgentComposition}
      defaultProps={{ skillKey: "auth" as const, layout: "split" as const, theme: "light" as const }}
      durationInFrames={agentDuration(agentSkills.auth!)}
      id="AgentAuth"
      schema={agentSchema}
      {...size}
    />
    <Composition
      component={AgentComposition}
      defaultProps={{ skillKey: "cms" as const, layout: "split" as const, theme: "light" as const }}
      durationInFrames={agentDuration(agentSkills.cms!)}
      id="AgentCMS"
      schema={agentSchema}
      {...size}
    />
    <Composition
      component={ContentNegotiationComposition}
      defaultProps={{ layout: "split" as const, theme: "light" as const }}
      durationInFrames={CONTENT_NEGOTIATION_DURATION}
      id="ContentNegotiation"
      schema={layoutSchema}
      {...size}
    />
    <Composition
      component={TransformationComposition}
      defaultProps={{ layout: "full" as const, theme: "dark" as const }}
      durationInFrames={TRANSFORMATION_DURATION}
      id="Transformation"
      schema={layoutSchema}
      {...size}
    />
    <Composition
      component={AssistantComposition}
      defaultProps={{ layout: "split" as const, theme: "light" as const }}
      durationInFrames={ASSISTANT_DURATION}
      id="Assistant"
      schema={layoutSchema}
      {...size}
    />
  </>
);
