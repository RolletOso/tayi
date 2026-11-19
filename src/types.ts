export type VehicleType = "Keke" | "Keke Bus" | "Normal Bus" | "Coaster Bus";
export type Stop = { id: string; name: string; area: string; landmark: string; aliases: string[] };
export type Leg = { id: string; from: string; to: string; vehicle: VehicleType; heading: string; boardAt: string; dropAt: string; landmarks: string[]; minutes: [number, number]; fare: [number, number] | null; lastConfirmed: string | null };
export type RouteLeg = Leg & { direction: "forward" | "reverse"; start: string; end: string };
export type Trip = { id: string; from: string; to: string; legs: RouteLeg[]; minutes: [number, number]; pricedFare: [number, number]; unpricedCount: number; changes: number };