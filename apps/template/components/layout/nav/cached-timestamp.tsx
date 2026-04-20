import { cacheLife, cacheTag } from "next/cache";

async function getTimestamp() {
  "use cache";
  cacheLife("max");
  cacheTag("tmp");
  return new Date().toISOString();
}

export async function CachedTimestamp() {
  const timestamp = await getTimestamp();
  return <span className="text-sm">{timestamp}</span>;
}
