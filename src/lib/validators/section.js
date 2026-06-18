// global_backend/src/lib/validators/section.js
import { z } from "zod";

/**
 * Section validators for known section types.
 * Export validateByType(type, payload) which throws ZodError on validation failure.
 *
 * Known types: HERO, TEXT_BLOCK
 */

// Reusable CTA schema
const CtaSchema = z
  .object({
    text: z.string().nonempty("CTA text is required"),
    url: z.string().nonempty("CTA url is required"),
  })
  .partial({ url: false });

// HERO content schema
const HeroContentSchema = z
  .object({
    title: z.string().nonempty("Hero title is required"),
    subtitle: z.string().optional(),
    backgroundMediaId: z.string().optional(),
    backgroundUrl: z
      .string()
      .url("backgroundUrl must be a valid URL")
      .optional(),
    overlayColor: z.string().optional(),
    primaryButton: CtaSchema.optional(),
    secondaryButton: CtaSchema.optional(),
    alignment: z.enum(["left", "center", "right"]).optional(),
  })
  .strict();

// TEXT_BLOCK content schema
const TextBlockContentSchema = z
  .object({
    title: z.string().optional(),
    body: z.string().optional(),
    imageMediaId: z.string().optional(),
    imageUrl: z.string().url("imageUrl must be a valid URL").optional(),
    imagePosition: z.enum(["left", "right", "top"]).optional(),
    cta: CtaSchema.optional(),
  })
  .strict();

const TypeSchemaMap = {
  HERO: HeroContentSchema,
  TEXT_BLOCK: TextBlockContentSchema,
};

export function validateByType(type, payload) {
  if (!type) {
    throw new z.ZodError([
      {
        path: ["type"],
        message: "Section type is required",
        code: z.ZodIssueCode.custom,
      },
    ]);
  }

  const upper = String(type).toUpperCase();
  const schema = TypeSchemaMap[upper];
  if (!schema) {
    // unknown type: accept as-is
    return true;
  }

  const content = payload?.content ?? {};
  schema.parse(content);
  return true;
}

export function tryValidateByType(type, payload) {
  try {
    validateByType(type, payload);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}
