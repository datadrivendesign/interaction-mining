import {
  ChevronDown,
  Circle,
  Image as ImageIcon,
  Link2,
  List,
  Menu,
  MousePointerClick,
  Search,
  SlidersHorizontal,
  Smartphone,
  Square,
  SquareCheck,
  TextCursorInput,
  ToggleLeft,
} from "lucide-react";

export type TargetSlotOption = {
  value: string;
  label: string;
  icon: React.ReactNode;
};

export type TargetSlotOptionGroup = {
  label: string;
  options: TargetSlotOption[];
};

// Static, low-cognitive-load list used by the target-slot combobox.
// Free text is still allowed in the UI even when nothing matches this list.
export const TARGET_SLOT_OPTION_GROUPS: TargetSlotOptionGroup[] = [
  {
    label: "Buttons & links",
    options: [
      {
        value: "button",
        label: "button",
        icon: <MousePointerClick className="h-3.5 w-3.5" />,
      },
      { value: "link", label: "link", icon: <Link2 className="h-3.5 w-3.5" /> },
      { value: "tab", label: "tab", icon: <Square className="h-3.5 w-3.5" /> },
    ],
  },
  {
    label: "Input",
    options: [
      {
        value: "text box",
        label: "text box",
        icon: <TextCursorInput className="h-3.5 w-3.5" />,
      },
      {
        value: "search bar",
        label: "search bar",
        icon: <Search className="h-3.5 w-3.5" />,
      },
      {
        value: "dropdown menu",
        label: "dropdown menu",
        icon: <ChevronDown className="h-3.5 w-3.5" />,
      },
    ],
  },
  {
    label: "Controls",
    options: [
      {
        value: "switch",
        label: "switch",
        icon: <ToggleLeft className="h-3.5 w-3.5" />,
      },
      {
        value: "checkbox",
        label: "checkbox",
        icon: <SquareCheck className="h-3.5 w-3.5" />,
      },
      {
        value: "slider",
        label: "slider",
        icon: <SlidersHorizontal className="h-3.5 w-3.5" />,
      },
    ],
  },
  {
    label: "Layout",
    options: [
      {
        value: "screen",
        label: "screen",
        icon: <Smartphone className="h-3.5 w-3.5" />,
      },
      {
        value: "list item",
        label: "list item",
        icon: <List className="h-3.5 w-3.5" />,
      },
      { value: "menu", label: "menu", icon: <Menu className="h-3.5 w-3.5" /> },
    ],
  },
  {
    label: "Media",
    options: [
      {
        value: "icon",
        label: "icon",
        icon: <Circle className="h-3.5 w-3.5" />,
      },
      {
        value: "image",
        label: "image",
        icon: <ImageIcon className="h-3.5 w-3.5" />,
      },
    ],
  },
];
