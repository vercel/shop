import assert from "node:assert/strict";
import test from "node:test";

import { appendVaryAccept, negotiateRepresentation } from "./negotiation.ts";

test("defaults requests without an Accept header to HTML", () => {
  assert.equal(negotiateRepresentation(null), "text/html");
});

test("defaults wildcard requests to HTML", () => {
  assert.equal(negotiateRepresentation("*/*"), "text/html");
});

test("selects Markdown when requested", () => {
  assert.equal(negotiateRepresentation("text/markdown"), "text/markdown");
});

test("uses client order to resolve equal quality values", () => {
  assert.equal(negotiateRepresentation("text/markdown, text/html"), "text/markdown");
  assert.equal(negotiateRepresentation("text/html, text/markdown"), "text/html");
});

test("selects the representation with the higher quality value", () => {
  assert.equal(negotiateRepresentation("text/html;q=0.5, text/markdown;q=0.9"), "text/markdown");
});

test("honors specific exclusions over wildcards", () => {
  assert.equal(negotiateRepresentation("text/html;q=0, */*;q=1"), "text/markdown");
  assert.equal(negotiateRepresentation("text/markdown;q=0, */*;q=1"), "text/html");
});

test("returns null when no representation is acceptable", () => {
  assert.equal(negotiateRepresentation("application/pdf"), null);
  assert.equal(negotiateRepresentation("text/html;q=0, text/markdown;q=0"), null);
});

test("appends Accept to Vary without dropping or duplicating values", () => {
  const headers = new Headers({ Vary: "RSC, Next-Router-State-Tree" });
  appendVaryAccept(headers);
  appendVaryAccept(headers);

  assert.equal(headers.get("Vary"), "RSC, Next-Router-State-Tree, Accept");
});
