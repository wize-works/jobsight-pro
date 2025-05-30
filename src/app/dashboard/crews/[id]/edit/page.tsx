import { getCrewById, updateCrew, getCrewMembersByCrewId } from "@/app/actions/crews";
import Link from "next/link";
import CrewEditForm from "../../components/edit";
import { Crew, CrewUpdate } from "@/types/crews";
import { CrewMember } from "@/types/crew-members";

export default async function EditCrewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: crewId } = await params;
    const crew = await getCrewById(crewId) as Crew;
    const members = await getCrewMembersByCrewId(crewId) || [];

    if (!crew) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <h2 className="text-xl mb-4">Crew not found</h2>
                <p>The requested crew does not exist or you don't have permission to view it.</p>            </div>
        );
    } async function handleUpdateCrew(formData: any) {
        "use server";
        const crewData = {
            id: crewId,
            business_id: crew.business_id,
            name: formData.name,
            status: formData.status,
            leader_id: formData.leader_id || null,
            specialty: formData.specialty,
            notes: formData.notes,
        } as CrewUpdate;

        try {
            const result = await updateCrew(crewId, crewData);

            return { success: true };
        } catch (error) {
            console.error("Error updating crew:", error);
            throw new Error("Failed to update crew");
        }
    } return (
        <div className="">
            <div className="flex justify-start items-center mb-4">
                <Link href={`/dashboard/crews/${crewId}`} className="btn btn-ghost btn-sm mb-4 mr-2">
                    <i className="fas fa-arrow-left fa-xl"></i>
                </Link>
                <h1 className="text-2xl font-bold mb-4">Edit Crew</h1>
            </div>
            <CrewEditForm crew={crew as unknown as Crew} members={members as unknown as CrewMember[]} onSubmit={handleUpdateCrew} />
        </div>
    );
}