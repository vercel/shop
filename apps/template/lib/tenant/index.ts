import type { Team, TeamId } from "./types";

export const TEAMS = {
  team1: {
    apparelColor: "Blue",
    ctaColor: "#1d4ed8",
    ctaForeground: "#ffffff",
    description: "Find your next game-day favorite and show up for Northside.",
    heading: "Wear your Northside pride.",
    id: "team1",
    name: "Northside Hawks",
  },
  team2: {
    apparelColor: "Red",
    ctaColor: "#b91c1c",
    ctaForeground: "#ffffff",
    description: "Apparel for Harbor supporters, from the first whistle to the trip home.",
    heading: "All in for Harbor.",
    id: "team2",
    name: "Harbor Foxes",
  },
  team3: {
    apparelColor: "Green",
    ctaColor: "#166534",
    ctaForeground: "#ffffff",
    description: "Get ready for the season with everyday favorites for Summit fans.",
    heading: "Show up for Summit.",
    id: "team3",
    name: "Summit Bears",
  },
  team4: {
    apparelColor: "Purple",
    ctaColor: "#7e22ce",
    ctaForeground: "#ffffff",
    description: "Pick your game-day look and support Metro wherever you watch.",
    heading: "Make it a Metro game day.",
    id: "team4",
    name: "Metro Wolves",
  },
} satisfies Record<TeamId, Team>;

export function isTeamId(value: string): value is TeamId {
  return Object.hasOwn(TEAMS, value);
}

export function getTeamIdFromHost(authority: string): TeamId | null {
  let host: string;
  try {
    const url = new URL(`http://${authority}`);
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    host = url.hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return null;
  }
  const firstLabel = host.split(".")[0];
  const separator = firstLabel.indexOf("---");

  if (separator !== -1) {
    const id = firstLabel.slice(0, separator);
    const deployment = firstLabel.slice(separator + 3);
    return isTeamId(id) && deployment.length > 0 && host.includes(".") ? id : null;
  }

  if (host.endsWith(".localhost")) {
    const id = host.slice(0, -".localhost".length);
    return isTeamId(id) ? id : null;
  }

  return "team1";
}
