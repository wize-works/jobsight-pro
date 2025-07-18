import type {
    Crew,
    CrewInsert,
    CrewUpdate,
    CrewWithDetails,
    CrewWithStats
} from '@/types/crews';
import type { CrewMember, CrewMemberInsert, CrewMemberUpdate } from '@/types/crew-members';
import type { CrewMemberAssignment, CrewMemberAssignmentInsert } from '@/types/crew-member-assignments';

export interface CrewApiResponse<T = any> {
    data: T | null;
    error: string | null;
    loading: boolean;
}

export interface CrewSearchParams {
    search?: string;
    status?: string;
    specialty?: string;
    leader_id?: string;
    page?: number;
    limit?: number;
    include_stats?: boolean;
    include_members?: boolean;
    include_projects?: boolean;
}

export interface CrewMemberSearchParams {
    status?: string;
    role?: string;
    include_stats?: boolean;
}

export interface CrewAssignmentSearchParams {
    status?: string;
    project_id?: string;
    include_stats?: boolean;
}

class CrewsApi {
    private baseUrl = '/api/crews';

    async getCrews(params?: CrewSearchParams): Promise<CrewApiResponse<{
        crews: CrewWithDetails[];
        stats?: any;
        pagination?: any;
    }>> {
        try {
            const searchParams = new URLSearchParams();
            if (params?.search) searchParams.append('q', params.search);
            if (params?.status) searchParams.append('status', params.status);
            if (params?.specialty) searchParams.append('specialty', params.specialty);
            if (params?.leader_id) searchParams.append('leader_id', params.leader_id);
            if (params?.page) searchParams.append('page', params.page.toString());
            if (params?.limit) searchParams.append('limit', params.limit.toString());
            if (params?.include_stats) searchParams.append('include_stats', 'true');
            if (params?.include_members) searchParams.append('include_members', 'true');
            if (params?.include_projects) searchParams.append('include_projects', 'true');

            const response = await fetch(`${this.baseUrl}?${searchParams}`);

            if (!response.ok) {
                const error = await response.json();
                return { data: null, error: error.error || 'Failed to fetch crews', loading: false };
            }

            const responseData = await response.json();

            // Handle the new response format { success: true, data: [...] }
            if (responseData.success && responseData.data) {
                const data = {
                    crews: responseData.data,
                    stats: responseData.stats,
                    pagination: responseData.pagination
                };
                return { data, error: null, loading: false };
            } else {
                return { data: null, error: 'Invalid response format', loading: false };
            }
        } catch (error) {
            return { data: null, error: 'Network error', loading: false };
        }
    }

    async getCrew(id: string, params?: {
        include_members?: boolean;
        include_projects?: boolean;
        include_stats?: boolean;
    }): Promise<CrewApiResponse<CrewWithDetails>> {
        try {
            const searchParams = new URLSearchParams();
            if (params?.include_members) searchParams.append('include_members', 'true');
            if (params?.include_projects) searchParams.append('include_projects', 'true');
            if (params?.include_stats) searchParams.append('include_stats', 'true');

            const response = await fetch(`${this.baseUrl}/${id}?${searchParams}`);

            if (!response.ok) {
                const error = await response.json();
                return { data: null, error: error.error || 'Failed to fetch crew', loading: false };
            }

            const data = await response.json();
            return { data, error: null, loading: false };
        } catch (error) {
            return { data: null, error: 'Network error', loading: false };
        }
    }

    async createCrew(crewData: CrewInsert): Promise<CrewApiResponse<Crew>> {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(crewData),
            });

            if (!response.ok) {
                const error = await response.json();
                return { data: null, error: error.error || 'Failed to create crew', loading: false };
            }

            const responseData = await response.json();

            // Handle the new response format { success: true, data: crew }
            if (responseData.success && responseData.data) {
                return { data: responseData.data, error: null, loading: false };
            } else {
                return { data: null, error: 'Invalid response format', loading: false };
            }
        } catch (error) {
            return { data: null, error: 'Network error', loading: false };
        }
    }

    async updateCrew(id: string, crewData: Partial<CrewUpdate>): Promise<CrewApiResponse<Crew>> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(crewData),
            });

            if (!response.ok) {
                const error = await response.json();
                return { data: null, error: error.error || 'Failed to update crew', loading: false };
            }

            const data = await response.json();
            return { data, error: null, loading: false };
        } catch (error) {
            return { data: null, error: 'Network error', loading: false };
        }
    }

    async deleteCrew(id: string): Promise<CrewApiResponse<{ message: string }>> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                return { data: null, error: error.error || 'Failed to delete crew', loading: false };
            }

            const data = await response.json();
            return { data, error: null, loading: false };
        } catch (error) {
            return { data: null, error: 'Network error', loading: false };
        }
    }

    // Crew Members API
    members = {
        async getCrewMembers(crewId: string, params?: CrewMemberSearchParams): Promise<CrewApiResponse<{
            members: CrewMember[];
            stats?: any;
        }>> {
            try {
                const searchParams = new URLSearchParams();
                if (params?.status) searchParams.append('status', params.status);
                if (params?.role) searchParams.append('role', params.role);
                if (params?.include_stats) searchParams.append('include_stats', 'true');

                const response = await fetch(`/api/crews/${crewId}/members?${searchParams}`);

                if (!response.ok) {
                    const error = await response.json();
                    return { data: null, error: error.error || 'Failed to fetch crew members', loading: false };
                }

                const data = await response.json();
                return { data, error: null, loading: false };
            } catch (error) {
                return { data: null, error: 'Network error', loading: false };
            }
        },

        async getCrewMember(crewId: string, memberId: string): Promise<CrewApiResponse<CrewMember>> {
            try {
                const response = await fetch(`/api/crews/${crewId}/members/${memberId}`);

                if (!response.ok) {
                    const error = await response.json();
                    return { data: null, error: error.error || 'Failed to fetch crew member', loading: false };
                }

                const data = await response.json();
                return { data, error: null, loading: false };
            } catch (error) {
                return { data: null, error: 'Network error', loading: false };
            }
        },

        async createCrewMember(crewId: string, memberData: CrewMemberInsert): Promise<CrewApiResponse<CrewMember>> {
            try {
                const response = await fetch(`/api/crews/${crewId}/members`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(memberData),
                });

                if (!response.ok) {
                    const error = await response.json();
                    return { data: null, error: error.error || 'Failed to create crew member', loading: false };
                }

                const data = await response.json();
                return { data, error: null, loading: false };
            } catch (error) {
                return { data: null, error: 'Network error', loading: false };
            }
        },

        async updateCrewMember(crewId: string, memberId: string, memberData: Partial<CrewMemberUpdate>): Promise<CrewApiResponse<CrewMember>> {
            try {
                const response = await fetch(`/api/crews/${crewId}/members/${memberId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(memberData),
                });

                if (!response.ok) {
                    const error = await response.json();
                    return { data: null, error: error.error || 'Failed to update crew member', loading: false };
                }

                const data = await response.json();
                return { data, error: null, loading: false };
            } catch (error) {
                return { data: null, error: 'Network error', loading: false };
            }
        },

        async deleteCrewMember(crewId: string, memberId: string): Promise<CrewApiResponse<{ message: string }>> {
            try {
                const response = await fetch(`/api/crews/${crewId}/members/${memberId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    const error = await response.json();
                    return { data: null, error: error.error || 'Failed to delete crew member', loading: false };
                }

                const data = await response.json();
                return { data, error: null, loading: false };
            } catch (error) {
                return { data: null, error: 'Network error', loading: false };
            }
        }
    };

    // Crew Assignments API
    assignments = {
        async getCrewAssignments(crewId: string, params?: CrewAssignmentSearchParams): Promise<CrewApiResponse<{
            assignments: CrewMemberAssignment[];
            stats?: any;
        }>> {
            try {
                const searchParams = new URLSearchParams();
                if (params?.status) searchParams.append('status', params.status);
                if (params?.project_id) searchParams.append('project_id', params.project_id);
                if (params?.include_stats) searchParams.append('include_stats', 'true');

                const response = await fetch(`/api/crews/${crewId}/assignments?${searchParams}`);

                if (!response.ok) {
                    const error = await response.json();
                    return { data: null, error: error.error || 'Failed to fetch crew assignments', loading: false };
                }

                const data = await response.json();
                return { data, error: null, loading: false };
            } catch (error) {
                return { data: null, error: 'Network error', loading: false };
            }
        },

        async getCrewAssignment(crewId: string, assignmentId: string): Promise<CrewApiResponse<CrewMemberAssignment>> {
            try {
                const response = await fetch(`/api/crews/${crewId}/assignments/${assignmentId}`);

                if (!response.ok) {
                    const error = await response.json();
                    return { data: null, error: error.error || 'Failed to fetch assignment', loading: false };
                }

                const data = await response.json();
                return { data, error: null, loading: false };
            } catch (error) {
                return { data: null, error: 'Network error', loading: false };
            }
        },

        async createCrewAssignment(crewId: string, assignmentData: CrewMemberAssignmentInsert): Promise<CrewApiResponse<CrewMemberAssignment>> {
            try {
                const response = await fetch(`/api/crews/${crewId}/assignments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(assignmentData),
                });

                if (!response.ok) {
                    const error = await response.json();
                    return { data: null, error: error.error || 'Failed to create assignment', loading: false };
                }

                const data = await response.json();
                return { data, error: null, loading: false };
            } catch (error) {
                return { data: null, error: 'Network error', loading: false };
            }
        },

        async updateCrewAssignment(crewId: string, assignmentId: string, assignmentData: Partial<CrewMemberAssignment>): Promise<CrewApiResponse<CrewMemberAssignment>> {
            try {
                const response = await fetch(`/api/crews/${crewId}/assignments/${assignmentId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(assignmentData),
                });

                if (!response.ok) {
                    const error = await response.json();
                    return { data: null, error: error.error || 'Failed to update assignment', loading: false };
                }

                const data = await response.json();
                return { data, error: null, loading: false };
            } catch (error) {
                return { data: null, error: 'Network error', loading: false };
            }
        },

        async deleteCrewAssignment(crewId: string, assignmentId: string): Promise<CrewApiResponse<{ message: string }>> {
            try {
                const response = await fetch(`/api/crews/${crewId}/assignments/${assignmentId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    const error = await response.json();
                    return { data: null, error: error.error || 'Failed to delete assignment', loading: false };
                }

                const data = await response.json();
                return { data, error: null, loading: false };
            } catch (error) {
                return { data: null, error: 'Network error', loading: false };
            }
        }
    };
}

export const crewsApi = new CrewsApi();
