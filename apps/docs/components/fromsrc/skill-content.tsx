import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Streamdown } from 'streamdown';

function stripFrontmatter(content: string): string {
  if (content.startsWith("---")) {
    const end = content.indexOf("---", 3);
    if (end !== -1) {
      return content.slice(end + 3).trim();
    }
  }
  return content;
}

const SKILLS_DIR = join(process.cwd(), "../template/.agents/skills");

export async function SkillContent({ skill }: { skill: string }) {
  const filePath = join(SKILLS_DIR, skill, "SKILL.md");
  const raw = await readFile(filePath, "utf-8");
  const content = stripFrontmatter(raw);

  return (
    <div className="prose dark:prose-invert">
      <Streamdown>{content}</Streamdown>
    </div>
  );
}
