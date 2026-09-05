import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

import config from "../.graphqlrc.ts";

const require = createRequire(import.meta.url);
const run = promisify(execFile);
const cli = join(dirname(require.resolve("@graphql-codegen/cli/package.json")), "cjs/bin.js");
const cases = [
  {
    api: "storefront",
    path: "lib/shopify/operations/probe.ts",
    source: "query Probe { shop { name } }",
  },
  { api: "storefront", path: "lib/cart/server.ts", source: "fragment Probe on Cart { id }" },
  { api: "storefront", path: "lib/search/server.ts", source: "fragment Probe on Product { id }" },
  {
    api: "customer",
    path: "lib/shopify/operations/customer.ts",
    source: "query Probe { customer { id } }",
  },
];

for (const { api, path, source } of cases) {
  test(`schema validation covers ${path}`, async () => {
    const root = await mkdtemp(join(tmpdir(), "shop-graphql-"));
    try {
      const project = config.projects[api];
      const schema = require.resolve(
        api === "customer"
          ? "@shopify/hydrogen/customer-account.schema.json"
          : "@shopify/hydrogen/storefront.schema.json",
      );
      const configuration = {
        documents: project.documents,
        generates: {
          [join(root, "result.d.ts")]: {
            preset: require.resolve("@shopify/api-codegen-preset"),
            presetConfig: { apiType: api === "customer" ? "Customer" : "Storefront" },
          },
        },
        schema,
      };
      const configPath = join(root, "codegen.cjs");
      const documentPath = join(root, path);
      await mkdir(dirname(documentPath), { recursive: true });
      await writeFile(
        configPath,
        `module.exports = { ...${JSON.stringify(configuration)}, pluckConfig: require(${JSON.stringify(require.resolve("@shopify/api-codegen-preset"))}).pluckConfig };`,
      );
      const document = (selection) => `export const PROBE = gql(\`#graphql\n${selection}\`);\n`;
      await writeFile(documentPath, document(source));
      await run(process.execPath, [cli, "--config", configPath], { cwd: root });
      await writeFile(
        documentPath,
        document(source.replace("{", "{ definitelyInvalidHydrogenField ")),
      );
      await assert.rejects(
        run(process.execPath, [cli, "--config", configPath], { cwd: root }),
        (error) => {
          assert.equal(error.code, 1);
          assert.match(
            `${error.stdout}\n${error.stderr}`,
            /Cannot query field "definitelyInvalidHydrogenField"/,
          );
          return true;
        },
      );
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
}
