import tribesData from "@/tribes.json";

export type Tribe = {
  id: string;
  name: string;
  color: string;
};

export const TRIBES = tribesData.tribes as Tribe[];

export function getTribeById(id: string): Tribe | undefined {
  return TRIBES.find((tribe) => tribe.id === id);
}
