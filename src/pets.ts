import type { Species } from "./types";

export interface SpeciesInfo {
  id: Species;
  /** Human readable name. */
  label: string;
  /**
   * Emoji used as the pet's face. Replace these with real sprite images
   * later - see the "real sprite art" task in the README.
   */
  emoji: string;
  /** Accent colour for the pet card. */
  accent: string;
  /** How fast hunger drains compared to other species. 1 = normal. */
  hungerRate: number;
  /** How fast happiness drains compared to other species. 1 = normal. */
  happinessRate: number;
  /** Starting personality line shown when you adopt the pet. */
  blurb: string;
}

/**
 * The catalogue of every pet species. Adding a new species is the easiest
 * first contribution to this project - add an entry here, then add it to the
 * `Species` union in types.ts.
 */
export const SPECIES: Record<Species, SpeciesInfo> = {
  cat: {
    id: "cat",
    label: "Cat",
    emoji: "🐱",
    accent: "#f4a261",
    hungerRate: 1,
    happinessRate: 1,
    blurb: "Sleeps 18 hours a day. Still judges you.",
  },
  dog: {
    id: "dog",
    label: "Dog",
    emoji: "🐶",
    accent: "#8ecae6",
    hungerRate: 1.4,
    happinessRate: 1.2,
    blurb: "Loves you unconditionally. Also loves food.",
  },
  rabbit: {
    id: "rabbit",
    label: "Rabbit",
    emoji: "🐰",
    accent: "#b8c0ff",
    hungerRate: 0.8,
    happinessRate: 0.7,
    blurb: "Quiet, tidy, and slightly terrified of everything.",
  },
  dragon: {
    id: "dragon",
    label: "Dragon",
    emoji: "🐲",
    accent: "#cdb4db",
    hungerRate: 1.8,
    happinessRate: 0.5,
    blurb: "Hoards coins. Occasionally sets things on fire.",
  },
};

/** Species in the order they should appear in the adoption menu. */
export const SPECIES_ORDER: Species[] = ["cat", "dog", "rabbit", "dragon"];
