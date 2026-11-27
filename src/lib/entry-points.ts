export const ENTRY_POINT_DESCRIPTIONS: Readonly<Record<string, string>> = {
  "software-engineering-excellence":
    "Engineering, learning, and the craft of software.",
  "chasing-big-goals": "Goals, habits, and feedback loops.",
  "creating-something-new": "Ideas, side projects, and making things.",
  "navigating-lifes-seasons": "Family, purpose, and life beyond work.",
};

export function entryPointDescription(id: string, fallback: string) {
  return ENTRY_POINT_DESCRIPTIONS[id] ?? fallback;
}
