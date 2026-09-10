export type TeamId = "team1" | "team2" | "team3" | "team4";

export interface Team {
  apparelColor: string;
  ctaColor: string;
  ctaForeground: string;
  description: string;
  heading: string;
  id: TeamId;
  name: string;
}
