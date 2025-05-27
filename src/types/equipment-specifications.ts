import type { Database } from "@/types/supabase";

export type EquipmentSpecification = Database["public"]["Tables"]["equipment_specifications"]["Row"];
export type EquipmentSpecificationInsert = Database["public"]["Tables"]["equipment_specifications"]["Insert"];
export type EquipmentSpecificationUpdate = Database["public"]["Tables"]["equipment_specifications"]["Update"];