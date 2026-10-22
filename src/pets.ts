import type { PetDefinition, PetId } from "./types";

/**
 * The catalogue of every pet the player can own.
 *
 * The art is a placeholder for now: each pet is a coloured square. When the
 * sprites arrive, swap the `color` for an image path and keep everything
 * else the same.
 */

export const PET_CATALOG: PetDefinition[] = [
  { id: "cat", name: "Cat", color: "#f4a261", price: 10 },
  { id: "dog", name: "Dog", color: "#8ecae6", price: 20 },
  { id: "rabbit", name: "Rabbit", color: "#b8c0ff", price: 30 },
  { id: "fox", name: "Fox", color: "#e07a5f", price: 45 },
  { id: "dragon", name: "Dragon", color: "#cdb4db", price: 70 },
  { id: "owl", name: "Owl", color: "#84b29f", price: 100 },
];

/** Look a pet up by id. */
export const PET_BY_ID: Record<PetId, PetDefinition> = Object.fromEntries(
  PET_CATALOG.map((pet) => [pet.id, pet]),
) as Record<PetId, PetDefinition>;

/** True when the id is a pet we know about. */
export function isPetId(value: unknown): value is PetId {
  return typeof value === "string" && value in PET_BY_ID;
}
