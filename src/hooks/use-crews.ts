import { useState, useCallback } from 'react';
import { crewsApi, type CrewApiResponse, type CrewSearchParams, type CrewMemberSearchParams, type CrewAssignmentSearchParams } from '@/lib/api/crews';
import type {
    Crew,
    CrewInsert,
    CrewUpdate,
    CrewWithDetails,
    CrewWithStats
} from '@/types/crews';
import type { CrewMember, CrewMemberInsert, CrewMemberUpdate } from '@/types/crew-members';
import type { CrewMemberAssignment, CrewMemberAssignmentInsert } from '@/types/crew-member-assignments';

// Main Crews Hook
export function useCrews() {
    const [crews, setCrews] = useState<CrewWithDetails[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCrews = useCallback(async (params?: CrewSearchParams) => {
        setLoading(true);
        setError(null);

        try {
            const result = await crewsApi.getCrews(params);

            if (result.error) {
                setError(result.error);
            } else {
                setCrews(result.data?.crews || []);
                setStats(result.data?.stats || null);
            }
        } catch (err) {
            setError('Failed to fetch crews');
        } finally {
            setLoading(false);
        }
    }, []);

    const getCrew = useCallback(async (id: string, params?: {
        include_members?: boolean;
        include_projects?: boolean;
        include_stats?: boolean;
    }) => {
        setLoading(true);
        setError(null);

        try {
            const result = await crewsApi.getCrew(id, params);

            if (result.error) {
                setError(result.error);
                return null;
            }

            return result.data;
        } catch (err) {
            setError('Failed to fetch crew');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createCrew = useCallback(async (crewData: CrewInsert) => {
        setLoading(true);
        setError(null);

        try {
            const result = await crewsApi.createCrew(crewData);

            if (result.error) {
                setError(result.error);
                return null;
            }

            // Add to local state
            if (result.data) {
                setCrews(prev => [result.data as CrewWithDetails, ...prev]);
            }

            return result.data;
        } catch (err) {
            setError('Failed to create crew');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateCrew = useCallback(async (id: string, crewData: Partial<CrewUpdate>) => {
        setLoading(true);
        setError(null);

        try {
            const result = await crewsApi.updateCrew(id, crewData);

            if (result.error) {
                setError(result.error);
                return null;
            }

            // Update local state
            if (result.data) {
                setCrews(prev => prev.map(crew =>
                    crew.id === id ? { ...crew, ...result.data } : crew
                ));
            }

            return result.data;
        } catch (err) {
            setError('Failed to update crew');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteCrew = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);

        try {
            const result = await crewsApi.deleteCrew(id);

            if (result.error) {
                setError(result.error);
                return false;
            }

            // Remove from local state
            setCrews(prev => prev.filter(crew => crew.id !== id));

            return true;
        } catch (err) {
            setError('Failed to delete crew');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshCrews = useCallback((params?: CrewSearchParams) => {
        fetchCrews(params);
    }, [fetchCrews]);

    return {
        crews,
        stats,
        loading,
        error,
        fetchCrews,
        getCrew,
        createCrew,
        updateCrew,
        deleteCrew,
        refreshCrews,
    };
}

// Crew Members Hook
export function useCrewMembers() {
    const [members, setMembers] = useState<CrewMember[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCrewMembers = useCallback(async (crewId: string, params?: CrewMemberSearchParams) => {
        setLoading(true);
        setError(null);

        try {
            const result = await crewsApi.members.getCrewMembers(crewId, params);

            if (result.error) {
                setError(result.error);
            } else {
                setMembers(result.data?.members || []);
                setStats(result.data?.stats || null);
            }
        } catch (err) {
            setError('Failed to fetch crew members');
        } finally {
            setLoading(false);
        }
    }, []);

    const getCrewMember = useCallback(async (crewId: string, memberId: string) => {
        setLoading(true);
        setError(null);

        try {
            const result = await crewsApi.members.getCrewMember(crewId, memberId);

            if (result.error) {
                setError(result.error);
                return null;
            }

            return result.data;
        } catch (err) {
            setError('Failed to fetch crew member');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createCrewMember = useCallback(async (crewId: string, memberData: CrewMemberInsert) => {
        setLoading(true);
        setError(null);

        try {
            const result = await crewsApi.members.createCrewMember(crewId, memberData);

            if (result.error) {
                setError(result.error);
                return null;
            }

            // Add to local state
            if (result.data) {
                setMembers(prev => [result.data as CrewMember, ...prev]);
            }

            return result.data;
        } catch (err) {
            setError('Failed to create crew member');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateCrewMember = useCallback(async (crewId: string, memberId: string, memberData: Partial<CrewMemberUpdate>) => {
        setLoading(true);
        setError(null);

        try {
            const result = await crewsApi.members.updateCrewMember(crewId, memberId, memberData);

            if (result.error) {
                setError(result.error);
                return null;
            }

            // Update local state
            if (result.data) {
                setMembers(prev => prev.map(member =>
                    member.id === memberId ? { ...member, ...result.data } : member
                ));
            }

            return result.data;
        } catch (err) {
            setError('Failed to update crew member');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteCrewMember = useCallback(async (crewId: string, memberId: string) => {
        setLoading(true);
        setError(null);

        try {
            const result = await crewsApi.members.deleteCrewMember(crewId, memberId);

            if (result.error) {
                setError(result.error);
                return false;
            }

            // Remove from local state
            setMembers(prev => prev.filter(member => member.id !== memberId));

            return true;
        } catch (err) {
            setError('Failed to delete crew member');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshCrewMembers = useCallback((crewId: string, params?: CrewMemberSearchParams) => {
        fetchCrewMembers(crewId, params);
    }, [fetchCrewMembers]);

    return {
        members,
        stats,
        loading,
        error,
        fetchCrewMembers,
        getCrewMember,
        createCrewMember,
        updateCrewMember,
        deleteCrewMember,
        refreshCrewMembers,
    };
}

// Crew Assignments Hook
export function useCrewAssignments() {
    const [assignments, setAssignments] = useState<CrewMemberAssignment[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCrewAssignments = useCallback(async (crewId: string, params?: CrewAssignmentSearchParams) => {
        setLoading(true);
        setError(null);

        try {
            const result = await crewsApi.assignments.getCrewAssignments(crewId, params);

            if (result.error) {
                setError(result.error);
            } else {
                setAssignments(result.data?.assignments || []);
                setStats(result.data?.stats || null);
            }
        } catch (err) {
            setError('Failed to fetch crew assignments');
        } finally {
            setLoading(false);
        }
    }, []);

    const getCrewAssignment = useCallback(async (crewId: string, assignmentId: string) => {
        setLoading(true);
        setError(null);

        try {
            const result = await crewsApi.assignments.getCrewAssignment(crewId, assignmentId);

            if (result.error) {
                setError(result.error);
                return null;
            }

            return result.data;
        } catch (err) {
            setError('Failed to fetch assignment');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createCrewAssignment = useCallback(async (crewId: string, assignmentData: CrewMemberAssignmentInsert) => {
        setLoading(true);
        setError(null);

        try {
            const result = await crewsApi.assignments.createCrewAssignment(crewId, assignmentData);

            if (result.error) {
                setError(result.error);
                return null;
            }

            // Add to local state
            if (result.data) {
                setAssignments(prev => [result.data as CrewMemberAssignment, ...prev]);
            }

            return result.data;
        } catch (err) {
            setError('Failed to create assignment');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateCrewAssignment = useCallback(async (crewId: string, assignmentId: string, assignmentData: Partial<CrewMemberAssignment>) => {
        setLoading(true);
        setError(null);

        try {
            const result = await crewsApi.assignments.updateCrewAssignment(crewId, assignmentId, assignmentData);

            if (result.error) {
                setError(result.error);
                return null;
            }

            // Update local state
            if (result.data) {
                setAssignments(prev => prev.map(assignment =>
                    assignment.id === assignmentId ? { ...assignment, ...result.data } : assignment
                ));
            }

            return result.data;
        } catch (err) {
            setError('Failed to update assignment');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteCrewAssignment = useCallback(async (crewId: string, assignmentId: string) => {
        setLoading(true);
        setError(null);

        try {
            const result = await crewsApi.assignments.deleteCrewAssignment(crewId, assignmentId);

            if (result.error) {
                setError(result.error);
                return false;
            }

            // Remove from local state
            setAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId));

            return true;
        } catch (err) {
            setError('Failed to delete assignment');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshCrewAssignments = useCallback((crewId: string, params?: CrewAssignmentSearchParams) => {
        fetchCrewAssignments(crewId, params);
    }, [fetchCrewAssignments]);

    return {
        assignments,
        stats,
        loading,
        error,
        fetchCrewAssignments,
        getCrewAssignment,
        createCrewAssignment,
        updateCrewAssignment,
        deleteCrewAssignment,
        refreshCrewAssignments,
    };
}
