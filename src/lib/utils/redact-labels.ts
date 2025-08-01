export interface RedactLabel {
  value: string;
  label: string;
  requiresCustomInput?: boolean;
}

export const redactLabels: RedactLabel[] = [
  {
    value: "Name", 
    label: "Name"
  },  
  {
    value: "Photo",
    label: "Photo"
  },
  {
    value: "Email",
    label: "Email"
  },
  {
    value: "Location",
    label: "Location"
  },
  {
    value: "Phone",
    label: "Phone"
  },
  {
    value: "Financial",
    label: "Financial"
  },
  {
    value: "Other",
    label: "Other",
    requiresCustomInput: true
  }
];

// Helper function to get label by value
export const getRedactLabel = (value: string): RedactLabel | undefined => {
  return redactLabels.find(label => label.value === value);
};

// Helper function to check if label requires custom input
export const requiresCustomInput = (value: string): boolean => {
  const label = getRedactLabel(value);
  return label?.requiresCustomInput || false;
};