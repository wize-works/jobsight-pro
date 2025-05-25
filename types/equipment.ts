import type { Database } from "@/types/supabase";
import { EquipmentAssignment } from "./equipment-assignments";

export type Equipment = Database["public"]["Tables"]["equipment"]["Row"];
export type EquipmentInsert = Database["public"]["Tables"]["equipment"]["Insert"];
export type EquipmentUpdate = Database["public"]["Tables"]["equipment"]["Update"];

export type EquipmentWithAssignment = Equipment & EquipmentAssignment;
export type EquipmentWithAssignments = EquipmentWithAssignment[];