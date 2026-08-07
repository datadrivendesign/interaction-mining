import { useCallback, useEffect, useRef } from "react";

/**
 * Remembers, per key, whether the keydown that started the current press landed
 * inside a form field.
 *
 * `keyup`-bound hotkeys cannot trust the release event's target. If the field
 * being typed into unmounts between keydown and keyup — which happens whenever
 * a form write moves the focused screen — the release arrives with `<body>` as
 * its target and is indistinguishable from a bare workspace keypress. The
 * keydown is the only trustworthy signal of intent, so it gets recorded there.
 *
 * @returns Predicate answering whether the in-flight press of `key` began as
 * text entry.
 */
export function useFormFieldKeyPressGuard() {
  const keysStartedInFormFieldRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const isFormField = (target: EventTarget | null) =>
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable);

    // Capture phase, so the flag is recorded before any hotkey handler reads it
    // and before React commits the update that may unmount the field.
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (isFormField(event.target)) {
        keysStartedInFormFieldRef.current.add(key);
        return;
      }
      // Cleared on the next keydown rather than on keyup: a key's keydown
      // always precedes its keyup, so this is enough to keep flags fresh, and
      // it avoids racing the keyup listeners that need to read the flag.
      keysStartedInFormFieldRef.current.delete(key);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  return useCallback(
    (key: string) => keysStartedInFormFieldRef.current.has(key.toLowerCase()),
    [],
  );
}
