import assert from "node:assert/strict";
import test from "node:test";

import {
  allEncodedVariantsAvailable,
  decodeEncodedVariant,
  encodedVariantSet,
} from "./variant-encoding.ts";

test("decodes nested option combinations", () => {
  assert.deepEqual(decodeEncodedVariant("v1_0:0:0,1:0-1,,1:0:0-1,1:1,,2:0:1,1:0,,"), [
    [0, 0, 0],
    [0, 1, 0],
    [0, 1, 1],
    [1, 0, 0],
    [1, 0, 1],
    [1, 1, 1],
    [2, 0, 1],
    [2, 1, 0],
  ]);
});

test("decodes ranges and repeated prefixes", () => {
  assert.deepEqual(decodeEncodedVariant("v1_0:0-2,1:2,"), [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 2],
  ]);
});

test("decodes ranges", () => {
  assert.deepEqual(decodeEncodedVariant("v1_0-2"), [[0], [1], [2]]);
});

test("adds prefixes used for partial option availability", () => {
  assert.deepEqual([...encodedVariantSet("v1_0:1,")], ["0", "0,1"]);
});

test("rejects unsupported encoding versions", () => {
  assert.throws(() => decodeEncodedVariant("v2_0"), /Unsupported option value encoding/);
});

test("reports every existing variant available when the encodings match", () => {
  assert.equal(allEncodedVariantsAvailable("v1_0:0-1,1:0,", "v1_0:0-1,1:0,"), true);
});

test("reports unavailable variants when availability is a subset of existence", () => {
  assert.equal(allEncodedVariantsAvailable("v1_0:0-1,1:0,", "v1_0:0,1:0,"), false);
});
