---
name: Drizzle identity insert schemas
description: A compatibility note for generated insert schemas when using identity columns with drizzle-zod.
---

Identity columns generated with `generatedAlwaysAsIdentity()` are already absent from `createInsertSchema()` output in this workspace's drizzle-zod version.

**Why:** Explicitly calling `.omit({ id: true })` on those generated shapes throws an "Unrecognized key" error during schema loading and prevents database commands from starting.

**How to apply:** Only omit fields that are present in the generated insert schema; keep identity primary keys out of the explicit omit list.