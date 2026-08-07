/**
 * Drops screens whose id has already been seen, keeping the first occurrence.
 *
 * Screen id is the key for selection, gestures, redactions and view hierarchies,
 * so a duplicate makes all four ambiguous: two filmstrip entries highlight as
 * selected at once, and deleting one removes whichever matches first rather than
 * the one that was clicked. Position used to disambiguate this; identity does
 * not. Drafts are external JSON written by earlier versions of the editor, so
 * the invariant is enforced on the way in rather than assumed.
 *
 * @param screens - Screens as loaded from a draft or capture metadata file.
 * @returns The same screens in order, minus later entries repeating an id.
 */
export function dedupeScreensById<T extends { id: string }>(
  screens: T[],
): T[] {
  const seenIds = new Set<string>();
  return screens.filter((screen) => {
    if (seenIds.has(screen.id)) {
      console.warn(
        `Dropping screen with duplicate id "${screen.id}" while loading draft.`,
      );
      return false;
    }
    seenIds.add(screen.id);
    return true;
  });
}
