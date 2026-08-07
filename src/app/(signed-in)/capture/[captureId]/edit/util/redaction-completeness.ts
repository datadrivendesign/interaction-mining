/** A redaction box only needs its label for these checks. */
type LabelledRedaction = { annotation?: string | null };

/**
 * Whether a redaction box carries a usable label.
 *
 * Stricter than `RedactionSchema`, which only rejects an empty string: a
 * whitespace-only label is no more useful to a reviewer than a blank one.
 */
export function isRedactionLabelled(redaction: LabelledRedaction): boolean {
  return (redaction.annotation ?? "").trim().length > 0;
}

/**
 * How many of a screen's redaction boxes still need a label.
 *
 * Shared by the redact filmstrip's error ring and the step gate in page.tsx so
 * the screens flagged in one are exactly the screens named by the other.
 *
 * @param redactions - A screen's redaction boxes, if it has any.
 */
export function countUnlabelledRedactions(
  redactions: LabelledRedaction[] | undefined,
): number {
  return (redactions ?? []).filter(
    (redaction) => !isRedactionLabelled(redaction),
  ).length;
}
