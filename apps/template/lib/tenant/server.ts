import "server-only";
import { notFound } from "next/navigation";
import { team } from "next/root-params";

import { isTeamId, TEAMS } from "./index";
import type { Team } from "./types";

export async function getTeam(): Promise<Team> {
  const id = await team();
  if (!isTeamId(id)) notFound();
  return TEAMS[id];
}
