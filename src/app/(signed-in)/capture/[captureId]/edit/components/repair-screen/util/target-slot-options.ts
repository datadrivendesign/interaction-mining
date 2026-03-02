export type TargetSlotOption = {
  value: string;
  label: string;
};

export type TargetSlotOptionGroup = {
  label: string;
  options: TargetSlotOption[];
};

// Static, low-cognitive-load list used by the target-slot combobox.
// Free text is still allowed in the UI even when nothing matches this list.
export const TARGET_SLOT_OPTION_GROUPS: TargetSlotOptionGroup[] = [
  {
    label: "Common controls",
    options: [
      { value: "button", label: "button" },
      { value: "text field", label: "text field" },
      { value: "search bar", label: "search bar" },
      { value: "switch", label: "switch" },
      { value: "slider", label: "slider" },
      { value: "tab", label: "tab" },
      { value: "menu", label: "menu" },
      { value: "link", label: "link" },
      { value: "list item", label: "list item" },
    ],
  },
  {
    label: "Content",
    options: [
      { value: "icon", label: "icon" },
      { value: "image", label: "image" },
      { value: "map", label: "map" },
    ],
  },
];
