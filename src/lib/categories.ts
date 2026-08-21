export const CATEGORY_VALUES = [
  "ai",
  "devtools",
  "productivity",
  "marketing",
  "sales",
  "finance",
  "design",
  "analytics",
  "other",
] as const;

export type Category = (typeof CATEGORY_VALUES)[number];

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "ai", label: "AI" },
  { value: "devtools", label: "Devtools" },
  { value: "productivity", label: "Productivity" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "finance", label: "Finance" },
  { value: "design", label: "Design" },
  { value: "analytics", label: "Analytics" },
  { value: "other", label: "Other" },
];

export function categoryLabel(value: string) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? "Other";
}
