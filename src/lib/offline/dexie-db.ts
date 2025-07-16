import Dexie, { Table } from 'dexie';
import { Business, BusinessUpdate } from '@/types/business';
import { User, UserInsert, UserUpdate } from '@/types/users';
import { BusinessSubscription, BusinessSubscriptionInsert, BusinessSubscriptionUpdate } from '@/types/subscription';
import { Project, ProjectInsert, ProjectUpdate } from '@/types/projects';
import { Client, ClientInsert, ClientUpdate } from '@/types/clients';
import { Equipment, EquipmentInsert, EquipmentUpdate } from '@/types/equipment';
import { Task, TaskInsert, TaskUpdate } from '@/types/tasks';
import { Subtask, SubtaskInsert, SubtaskUpdate } from '@/types/subtasks';
import { TaskNote, TaskNoteInsert, TaskNoteUpdate } from '@/types/task-notes';
import { TaskDependency, TaskDependencyInsert, TaskDependencyUpdate } from '@/types/task_dependencies';
import { DailyLog, DailyLogInsert, DailyLogUpdate } from '@/types/daily-logs';
import { DailyLogEquipment, DailyLogEquipmentInsert, DailyLogEquipmentUpdate } from '@/types/daily-log-equipment';
import { DailyLogMaterial, DailyLogMaterialInsert, DailyLogMaterialUpdate } from '@/types/daily-log-materials';
import { DailyLogImage, DailyLogImageInsert, DailyLogImageUpdate } from '@/types/daily-log-image';
import { Crew, CrewInsert, CrewUpdate } from '@/types/crews';
import { CrewMember, CrewMemberInsert, CrewMemberUpdate } from '@/types/crew-members';
import { CrewMemberAssignment, CrewMemberAssignmentInsert, CrewMemberAssignmentUpdate } from '@/types/crew-member-assignments';
import { ProjectCrew, ProjectCrewInsert, ProjectCrewUpdate } from '@/types/project-crews';
import { ClientContact, ClientContactInsert, ClientContactUpdate } from '@/types/client-contacts';
import { ClientInteraction, ClientInteractionInsert, ClientInteractionUpdate } from '@/types/client-interactions';
import { ProjectMilestone, ProjectMilestoneInsert, ProjectMilestoneUpdate } from '@/types/project_milestones';
import { ProjectIssue, ProjectIssueInsert, ProjectIssueUpdate } from '@/types/projects-issues';
import { EquipmentAssignment, EquipmentAssignmentInsert, EquipmentAssignmentUpdate } from '@/types/equipment-assignments';
import { EquipmentMaintenance, EquipmentMaintenanceInsert, EquipmentMaintenanceUpdate } from '@/types/equipment-maintenance';
import { EquipmentSpecification, EquipmentSpecificationInsert, EquipmentSpecificationUpdate } from '@/types/equipment-specifications';
import { EquipmentUsage, EquipmentUsageInsert, EquipmentUsageUpdate } from '@/types/equipment_usage';
import { Invoice, InvoiceInsert, InvoiceUpdate } from '@/types/invoices';
import { InvoiceItem, InvoiceItemInsert, InvoiceItemUpdate } from '@/types/invoice-items';
import { StripeInvoice, StripeInvoiceInsert, StripeInvoiceUpdate } from '@/types/stripe-invoices';
import { StripePaymentEvent, StripePaymentEventInsert, StripePaymentEventUpdate } from '@/types/stripe-payment-events';
import { InvoiceAutomationRule } from '@/types/invoice-automation';
import { Media, MediaLink, MediaMetadata, MediaTag, MediaUploadQueueItem } from '@/types/media';
import { Document, DocumentInsert, DocumentUpdate } from '@/types/documents';

/**
 * Offline Database Schema and Manager for Business Data
 * 
 * IMPORTANT: All 'userId' references in this file refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures consistent user identification and optimal performance.
 */

// Define the database interface
export interface OfflineDB extends Dexie {
    // Business entities
    businesses: Table<Business>;

    // User entities (Phase 2)
    users: Table<User>;

    // Subscription entities (Phase 2)
    businessSubscriptions: Table<BusinessSubscription>;

    // Core business operation entities (Phase 3)
    projects: Table<Project>;
    clients: Table<Client>;
    equipment: Table<Equipment>;

    // Extended business operation entities (Phase 4 - Priority 1)
    tasks: Table<Task>;
    subtasks: Table<Subtask>;
    taskNotes: Table<TaskNote>;
    taskDependencies: Table<TaskDependency>;

    // Daily Operations System entities (Phase 4.2)
    dailyLogs: Table<DailyLog>;
    dailyLogEquipment: Table<DailyLogEquipment>;
    dailyLogMaterials: Table<DailyLogMaterial>;
    dailyLogImages: Table<DailyLogImage>;

    // Crew Management System entities (Phase 4.3)
    crews: Table<Crew>;
    crewMembers: Table<CrewMember>;
    crewMemberAssignments: Table<CrewMemberAssignment>;
    projectCrews: Table<ProjectCrew>;

    // Client Extensions (Phase 4.4)
    clientContacts: Table<ClientContact>;
    clientInteractions: Table<ClientInteraction>;

    // Project Extensions (Phase 4.5)
    projectMilestones: Table<ProjectMilestone>;
    projectIssues: Table<ProjectIssue>;

    // Equipment Extensions (Phase 4.6)
    equipmentAssignments: Table<EquipmentAssignment>;
    equipmentMaintenance: Table<EquipmentMaintenance>;
    equipmentSpecifications: Table<EquipmentSpecification>;
    equipmentUsage: Table<EquipmentUsage>;

    // Financial System entities (Phase 5)
    invoices: Table<Invoice>;
    invoiceItems: Table<InvoiceItem>;
    invoiceAutomationRules: Table<InvoiceAutomationRule>;
    stripeInvoices: Table<StripeInvoice>;
    stripePaymentEvents: Table<StripePaymentEvent>;

    // Media System entities (Phase 6)
    media: Table<Media>;
    mediaLinks: Table<MediaLink>;
    mediaMetadata: Table<MediaMetadata>;
    mediaTags: Table<MediaTag>;

    // Media upload queue for offline handling
    mediaUploadQueue: Table<MediaUploadQueueItem>;

    // Document entities (Phase 7)
    documents: Table<Document>;

    // Sync queue for offline operations
    syncQueue: Table<{
        id: string;
        table: string;
        operation: 'insert' | 'update' | 'delete';
        data: any;
        businessId: string;
        userId?: string; // This is auth_id from auth provider, not internal user.id
        timestamp: number;
        retryCount: number;
        synced: boolean;
    }>;

    // Metadata for tracking sync status
    syncMetadata: Table<{
        id: string;
        lastSync: number;
        businessId: string;
        table: string;
        checksum?: string;
    }>;

    // User-business mappings for efficient offline lookup
    // Note: userId refers to auth_id from authentication provider
    userBusinessMappings: Table<{
        userId: string; // This is auth_id from auth provider, not internal user.id
        businessId: string;
        role: string;
        lastUpdated: number;
    }>;
}

// Create and configure the database
class JobSightOfflineDB extends Dexie implements OfflineDB {
    businesses!: Table<Business>;
    users!: Table<User>;
    businessSubscriptions!: Table<BusinessSubscription>;
    projects!: Table<Project>;
    clients!: Table<Client>;
    equipment!: Table<Equipment>;
    tasks!: Table<Task>;
    subtasks!: Table<Subtask>;
    taskNotes!: Table<TaskNote>;
    taskDependencies!: Table<TaskDependency>;
    dailyLogs!: Table<DailyLog>;
    dailyLogEquipment!: Table<DailyLogEquipment>;
    dailyLogMaterials!: Table<DailyLogMaterial>;
    dailyLogImages!: Table<DailyLogImage>;
    crews!: Table<Crew>;
    crewMembers!: Table<CrewMember>;
    crewMemberAssignments!: Table<CrewMemberAssignment>;
    projectCrews!: Table<ProjectCrew>;
    clientContacts!: Table<ClientContact>;
    clientInteractions!: Table<ClientInteraction>;
    projectMilestones!: Table<ProjectMilestone>;
    projectIssues!: Table<ProjectIssue>;
    equipmentAssignments!: Table<EquipmentAssignment>;
    equipmentMaintenance!: Table<EquipmentMaintenance>;
    equipmentSpecifications!: Table<EquipmentSpecification>;
    equipmentUsage!: Table<EquipmentUsage>;
    invoices!: Table<Invoice>;
    invoiceItems!: Table<InvoiceItem>;
    invoiceAutomationRules!: Table<InvoiceAutomationRule>;
    stripeInvoices!: Table<StripeInvoice>;
    stripePaymentEvents!: Table<StripePaymentEvent>;
    media!: Table<Media>;
    mediaLinks!: Table<MediaLink>;
    mediaMetadata!: Table<MediaMetadata>;
    mediaTags!: Table<MediaTag>;
    mediaUploadQueue!: Table<MediaUploadQueueItem>;
    documents!: Table<Document>;
    syncQueue!: Table<{
        id: string;
        table: string;
        operation: 'insert' | 'update' | 'delete';
        data: any;
        businessId: string;
        userId?: string;
        timestamp: number;
        retryCount: number;
        synced: boolean;
    }>;
    syncMetadata!: Table<{
        id: string;
        lastSync: number;
        businessId: string;
        table: string;
        checksum?: string;
    }>;
    userBusinessMappings!: Table<{
        userId: string;
        businessId: string;
        role: string;
        lastUpdated: number;
    }>;

    constructor() {
        super('JobSightOfflineDB');

        // Version 1: Business entities only
        this.version(1).stores({
            businesses: 'id, name, owner_id, business_type, created_at',
            syncQueue: 'id, table, businessId, timestamp, [synced+timestamp]',
            syncMetadata: 'id, businessId, table, lastSync',
            userBusinessMappings: 'userId, businessId'
        });

        // Version 2: Add users and subscriptions (Phase 2)
        this.version(2).stores({
            businesses: 'id, name, owner_id, business_type, created_at',
            users: 'id, auth_id, business_id, email, first_name, last_name, role, status',
            businessSubscriptions: 'id, business_id, plan_id, status, created_at',
            syncQueue: 'id, table, businessId, timestamp, [synced+timestamp]',
            syncMetadata: 'id, businessId, table, lastSync',
            userBusinessMappings: 'userId, businessId'
        });

        // Version 3: Add projects and clients (Phase 3)
        this.version(3).stores({
            businesses: 'id, name, owner_id, business_type, created_at',
            users: 'id, auth_id, business_id, email, first_name, last_name, role, status',
            businessSubscriptions: 'id, business_id, plan_id, status, created_at',
            projects: 'id, business_id, client_id, name, type, status, start_date, end_date, manager_id, created_at',
            clients: 'id, business_id, name, type, status, contact_email, contact_name, created_at',
            syncQueue: 'id, table, businessId, timestamp, [synced+timestamp]',
            syncMetadata: 'id, businessId, table, lastSync',
            userBusinessMappings: 'userId, businessId'
        });

        // Version 4: Add equipment (Phase 3 - Equipment Entity)
        this.version(4).stores({
            businesses: 'id, name, owner_id, business_type, created_at',
            users: 'id, auth_id, business_id, email, first_name, last_name, role, status',
            businessSubscriptions: 'id, business_id, plan_id, status, created_at',
            projects: 'id, business_id, client_id, name, type, status, start_date, end_date, manager_id, created_at',
            clients: 'id, business_id, name, type, status, contact_email, contact_name, created_at',
            equipment: 'id, business_id, name, type, status, condition, location, serial_number, created_at',
            syncQueue: 'id, table, businessId, timestamp, [synced+timestamp]',
            syncMetadata: 'id, businessId, table, lastSync',
            userBusinessMappings: 'userId, businessId'
        });

        // Version 5: Add tasks (Phase 4 - Priority 1 Task Management)
        this.version(5).stores({
            businesses: 'id, name, owner_id, business_type, created_at',
            users: 'id, auth_id, business_id, email, first_name, last_name, role, status',
            businessSubscriptions: 'id, business_id, plan_id, status, created_at',
            projects: 'id, business_id, client_id, name, type, status, start_date, end_date, manager_id, created_at',
            clients: 'id, business_id, name, type, status, contact_email, contact_name, created_at',
            equipment: 'id, business_id, name, type, status, condition, location, serial_number, created_at',
            tasks: 'id, business_id, project_id, name, status, priority, assigned_to, start_date, end_date, created_at',
            syncQueue: 'id, table, businessId, timestamp, [synced+timestamp]',
            syncMetadata: 'id, businessId, table, lastSync',
            userBusinessMappings: 'userId, businessId'
        });

        // Version 6: Add task management extensions (Phase 4.1 - Task Management Extensions)
        this.version(6).stores({
            businesses: 'id, name, owner_id, business_type, created_at',
            users: 'id, auth_id, business_id, email, first_name, last_name, role, status',
            businessSubscriptions: 'id, business_id, plan_id, status, created_at',
            projects: 'id, business_id, client_id, name, type, status, start_date, end_date, manager_id, created_at',
            clients: 'id, business_id, name, type, status, contact_email, contact_name, created_at',
            equipment: 'id, business_id, name, type, status, condition, location, serial_number, created_at',
            tasks: 'id, business_id, project_id, name, status, priority, assigned_to, start_date, end_date, created_at',
            subtasks: 'id, business_id, task_id, name, status, priority, assigned_to, created_at',
            taskNotes: 'id, business_id, task_id, author_id, content, date, created_at',
            taskDependencies: 'id, business_id, task_id, dependency_on_task_id, dependency_type, created_at',
            syncQueue: 'id, table, businessId, timestamp, [synced+timestamp]',
            syncMetadata: 'id, businessId, table, lastSync',
            userBusinessMappings: 'userId, businessId'
        });

        // Version 7: Add daily operations system (Phase 4.2 - Daily Operations System)
        this.version(7).stores({
            businesses: 'id, name, owner_id, business_type, created_at',
            users: 'id, auth_id, business_id, email, first_name, last_name, role, status',
            businessSubscriptions: 'id, business_id, plan_id, status, created_at',
            projects: 'id, business_id, client_id, name, type, status, start_date, end_date, manager_id, created_at',
            clients: 'id, business_id, name, type, status, contact_email, contact_name, created_at',
            equipment: 'id, business_id, name, type, status, condition, location, serial_number, created_at',
            tasks: 'id, business_id, project_id, name, status, priority, assigned_to, start_date, end_date, created_at',
            subtasks: 'id, business_id, task_id, name, status, priority, assigned_to, created_at',
            taskNotes: 'id, business_id, task_id, author_id, content, date, created_at',
            taskDependencies: 'id, business_id, task_id, dependency_on_task_id, dependency_type, created_at',
            dailyLogs: 'id, business_id, project_id, crew_id, author_id, date, start_time, end_time, created_at',
            dailyLogEquipment: 'id, business_id, daily_log_id, equipment_id, crew_member_id, hours, created_at',
            dailyLogMaterials: 'id, business_id, daily_log_id, name, quantity, cost, created_at',
            dailyLogImages: 'id, business_id, daily_log_id, media_id, url, created_at',
            syncQueue: 'id, table, businessId, timestamp, [synced+timestamp]',
            syncMetadata: 'id, businessId, table, lastSync',
            userBusinessMappings: 'userId, businessId'
        });

        // Version 8: Add crew management system (Phase 4.3 - Crew Management System)
        this.version(8).stores({
            businesses: 'id, name, owner_id, business_type, created_at',
            users: 'id, auth_id, business_id, email, first_name, last_name, role, status',
            businessSubscriptions: 'id, business_id, plan_id, status, created_at',
            projects: 'id, business_id, client_id, name, type, status, start_date, end_date, manager_id, created_at',
            clients: 'id, business_id, name, type, status, contact_email, contact_name, created_at',
            equipment: 'id, business_id, name, type, status, condition, location, serial_number, created_at',
            tasks: 'id, business_id, project_id, name, status, priority, assigned_to, start_date, end_date, created_at',
            subtasks: 'id, business_id, task_id, name, status, priority, assigned_to, created_at',
            taskNotes: 'id, business_id, task_id, author_id, content, date, created_at',
            taskDependencies: 'id, business_id, task_id, dependency_on_task_id, dependency_type, created_at',
            dailyLogs: 'id, business_id, project_id, crew_id, author_id, date, start_time, end_time, created_at',
            dailyLogEquipment: 'id, business_id, daily_log_id, equipment_id, crew_member_id, hours, created_at',
            dailyLogMaterials: 'id, business_id, daily_log_id, name, quantity, cost, created_at',
            dailyLogImages: 'id, business_id, daily_log_id, media_id, url, created_at',
            crews: 'id, business_id, leader_id, name, specialty, status, created_at',
            crewMembers: 'id, business_id, name, role, status, experience, created_at',
            crewMemberAssignments: 'id, business_id, crew_id, crew_member_id, created_at',
            projectCrews: 'id, business_id, crew_id, project_id, start_date, end_date, created_at',
            syncQueue: 'id, table, businessId, timestamp, [synced+timestamp]',
            syncMetadata: 'id, businessId, table, lastSync',
            userBusinessMappings: 'userId, businessId'
        });

        // Version 9: Add client extensions (Phase 4.4 - Client Extensions)
        this.version(9).stores({
            businesses: 'id, name, owner_id, business_type, created_at',
            users: 'id, auth_id, business_id, email, first_name, last_name, role, status',
            businessSubscriptions: 'id, business_id, plan_id, status, created_at',
            projects: 'id, business_id, client_id, name, type, status, start_date, end_date, manager_id, created_at',
            clients: 'id, business_id, name, type, status, contact_email, contact_name, created_at',
            equipment: 'id, business_id, name, type, status, condition, location, serial_number, created_at',
            tasks: 'id, business_id, project_id, name, status, priority, assigned_to, start_date, end_date, created_at',
            subtasks: 'id, business_id, task_id, name, status, priority, assigned_to, created_at',
            taskNotes: 'id, business_id, task_id, author_id, content, date, created_at',
            taskDependencies: 'id, business_id, task_id, dependency_on_task_id, dependency_type, created_at',
            dailyLogs: 'id, business_id, project_id, crew_id, author_id, date, start_time, end_time, created_at',
            dailyLogEquipment: 'id, business_id, daily_log_id, equipment_id, crew_member_id, hours, created_at',
            dailyLogMaterials: 'id, business_id, daily_log_id, name, quantity, cost, created_at',
            dailyLogImages: 'id, business_id, daily_log_id, media_id, url, created_at',
            crews: 'id, business_id, leader_id, name, specialty, status, created_at',
            crewMembers: 'id, business_id, name, role, status, experience, created_at',
            crewMemberAssignments: 'id, business_id, crew_id, crew_member_id, created_at',
            projectCrews: 'id, business_id, crew_id, project_id, start_date, end_date, created_at',
            clientContacts: 'id, business_id, client_id, name, email, phone, is_primary, created_at',
            clientInteractions: 'id, business_id, client_id, date, type, staff, follow_up_date, created_at',
            syncQueue: 'id, table, businessId, timestamp, [synced+timestamp]',
            syncMetadata: 'id, businessId, table, lastSync',
            userBusinessMappings: 'userId, businessId'
        });

        // Version 10: Project Extensions (Phase 4.5) - project-milestones and project-issues
        this.version(10).stores({
            businesses: 'id, name, owner_id, business_type, created_at',
            users: 'id, auth_id, business_id, email, first_name, last_name, role, status',
            businessSubscriptions: 'id, business_id, plan_id, status, created_at',
            projects: 'id, business_id, client_id, name, type, status, start_date, end_date, manager_id, created_at',
            clients: 'id, business_id, name, type, status, contact_email, contact_name, created_at',
            equipment: 'id, business_id, name, type, status, condition, location, serial_number, created_at',
            tasks: 'id, business_id, project_id, name, status, priority, assigned_to, start_date, end_date, created_at',
            subtasks: 'id, business_id, task_id, name, status, priority, assigned_to, created_at',
            taskNotes: 'id, business_id, task_id, author_id, content, date, created_at',
            taskDependencies: 'id, business_id, task_id, dependency_on_task_id, dependency_type, created_at',
            dailyLogs: 'id, business_id, project_id, crew_id, author_id, date, start_time, end_time, created_at',
            dailyLogEquipment: 'id, business_id, daily_log_id, equipment_id, crew_member_id, hours, created_at',
            dailyLogMaterials: 'id, business_id, daily_log_id, name, quantity, cost, created_at',
            dailyLogImages: 'id, business_id, daily_log_id, media_id, url, created_at',
            crews: 'id, business_id, leader_id, name, specialty, status, created_at',
            crewMembers: 'id, business_id, name, role, status, experience, created_at',
            crewMemberAssignments: 'id, business_id, crew_id, crew_member_id, created_at',
            projectCrews: 'id, business_id, crew_id, project_id, start_date, end_date, created_at',
            clientContacts: 'id, business_id, client_id, name, email, phone, is_primary, created_at',
            clientInteractions: 'id, business_id, client_id, date, type, staff, follow_up_date, created_at',
            projectMilestones: 'id, business_id, project_id, name, due_date, status, created_at',
            projectIssues: 'id, business_id, project_id, title, status, priority, reported_date, assigned_to, created_at',
            syncQueue: 'id, table, businessId, timestamp, [synced+timestamp]',
            syncMetadata: 'id, businessId, table, lastSync',
            userBusinessMappings: 'userId, businessId'
        });

        // Version 11: Equipment Extensions (Phase 4.6) - equipment assignments, maintenance, specifications, and usage
        this.version(11).stores({
            businesses: 'id, name, owner_id, business_type, created_at',
            users: 'id, auth_id, business_id, email, first_name, last_name, role, status',
            businessSubscriptions: 'id, business_id, plan_id, status, created_at',
            projects: 'id, business_id, client_id, name, type, status, start_date, end_date, manager_id, created_at',
            clients: 'id, business_id, name, type, status, contact_email, contact_name, created_at',
            equipment: 'id, business_id, name, type, status, condition, location, serial_number, created_at',
            tasks: 'id, business_id, project_id, name, status, priority, assigned_to, start_date, end_date, created_at',
            subtasks: 'id, business_id, task_id, name, status, priority, assigned_to, created_at',
            taskNotes: 'id, business_id, task_id, author_id, content, date, created_at',
            taskDependencies: 'id, business_id, task_id, dependency_on_task_id, dependency_type, created_at',
            dailyLogs: 'id, business_id, project_id, crew_id, author_id, date, start_time, end_time, created_at',
            dailyLogEquipment: 'id, business_id, daily_log_id, equipment_id, crew_member_id, hours, created_at',
            dailyLogMaterials: 'id, business_id, daily_log_id, name, quantity, cost, created_at',
            dailyLogImages: 'id, business_id, daily_log_id, media_id, url, created_at',
            crews: 'id, business_id, leader_id, name, specialty, status, created_at',
            crewMembers: 'id, business_id, name, role, status, experience, created_at',
            crewMemberAssignments: 'id, business_id, crew_id, crew_member_id, created_at',
            projectCrews: 'id, business_id, crew_id, project_id, start_date, end_date, created_at',
            clientContacts: 'id, business_id, client_id, name, email, phone, is_primary, created_at',
            clientInteractions: 'id, business_id, client_id, date, type, staff, follow_up_date, created_at',
            projectMilestones: 'id, business_id, project_id, name, due_date, status, created_at',
            projectIssues: 'id, business_id, project_id, title, status, priority, reported_date, assigned_to, created_at',
            equipmentAssignments: 'id, business_id, equipment_id, crew_id, project_id, start_date, end_date, status, created_at',
            equipmentMaintenance: 'id, business_id, equipment_id, maintenance_date, maintenance_type, maintenance_status, created_at',
            equipmentSpecifications: 'id, business_id, equipment_id, name, value, created_at',
            equipmentUsage: 'id, business_id, equipment_id, project_id, crew_id, start_date, end_date, hours_used, created_at',
            syncQueue: 'id, table, businessId, timestamp, [synced+timestamp]',
            syncMetadata: 'id, businessId, table, lastSync',
            userBusinessMappings: 'userId, businessId'
        });

        // Version 12: Financial System (Phase 5) - invoices, invoice items, and payment processing
        this.version(12).stores({
            businesses: 'id, name, owner_id, business_type, created_at',
            users: 'id, auth_id, business_id, email, first_name, last_name, role, status',
            businessSubscriptions: 'id, business_id, plan_id, status, created_at',
            projects: 'id, business_id, client_id, name, type, status, start_date, end_date, manager_id, created_at',
            clients: 'id, business_id, name, type, status, contact_email, contact_name, created_at',
            equipment: 'id, business_id, name, type, status, condition, location, serial_number, created_at',
            tasks: 'id, business_id, project_id, name, status, priority, assigned_to, start_date, end_date, created_at',
            subtasks: 'id, business_id, task_id, name, status, priority, assigned_to, created_at',
            taskNotes: 'id, business_id, task_id, author_id, content, date, created_at',
            taskDependencies: 'id, business_id, task_id, dependency_on_task_id, dependency_type, created_at',
            dailyLogs: 'id, business_id, project_id, crew_id, author_id, date, start_time, end_time, created_at',
            dailyLogEquipment: 'id, business_id, daily_log_id, equipment_id, crew_member_id, hours, created_at',
            dailyLogMaterials: 'id, business_id, daily_log_id, name, quantity, cost, created_at',
            dailyLogImages: 'id, business_id, daily_log_id, media_id, url, created_at',
            crews: 'id, business_id, leader_id, name, specialty, status, created_at',
            crewMembers: 'id, business_id, name, role, status, experience, created_at',
            crewMemberAssignments: 'id, business_id, crew_id, crew_member_id, created_at',
            projectCrews: 'id, business_id, crew_id, project_id, start_date, end_date, created_at',
            clientContacts: 'id, business_id, client_id, name, email, phone, is_primary, created_at',
            clientInteractions: 'id, business_id, client_id, date, type, staff, follow_up_date, created_at',
            projectMilestones: 'id, business_id, project_id, name, due_date, status, created_at',
            projectIssues: 'id, business_id, project_id, title, status, priority, reported_date, assigned_to, created_at',
            equipmentAssignments: 'id, business_id, equipment_id, crew_id, project_id, start_date, end_date, status, created_at',
            equipmentMaintenance: 'id, business_id, equipment_id, maintenance_date, maintenance_type, maintenance_status, created_at',
            equipmentSpecifications: 'id, business_id, equipment_id, name, value, created_at',
            equipmentUsage: 'id, business_id, equipment_id, project_id, crew_id, start_date, end_date, hours_used, created_at',
            invoices: 'id, business_id, project_id, client_id, invoice_number, status, due_date, total_amount, created_at',
            invoiceItems: 'id, business_id, invoice_id, description, quantity, rate, amount, created_at',
            stripeInvoices: 'id, business_id, stripe_invoice_id, status, created_at',
            stripePaymentEvents: 'id, business_id, stripe_event_id, event_type, created_at',
            syncQueue: 'id, table, businessId, timestamp, [synced+timestamp]',
            syncMetadata: 'id, businessId, table, lastSync',
            userBusinessMappings: 'userId, businessId'
        });

        // Version 13: Media System (Phase 6) - media files, metadata, and offline handling
        this.version(13).stores({
            businesses: 'id, name, owner_id, business_type, created_at',
            users: 'id, auth_id, business_id, email, first_name, last_name, role, status',
            businessSubscriptions: 'id, business_id, plan_id, status, created_at',
            projects: 'id, business_id, client_id, name, type, status, start_date, end_date, manager_id, created_at',
            clients: 'id, business_id, name, type, status, contact_email, contact_name, created_at',
            equipment: 'id, business_id, name, type, status, condition, location, serial_number, created_at',
            tasks: 'id, business_id, project_id, name, status, priority, assigned_to, start_date, end_date, created_at',
            subtasks: 'id, business_id, task_id, name, status, priority, assigned_to, created_at',
            taskNotes: 'id, business_id, task_id, author_id, content, date, created_at',
            taskDependencies: 'id, business_id, task_id, dependency_on_task_id, dependency_type, created_at',
            dailyLogs: 'id, business_id, project_id, crew_id, author_id, date, start_time, end_time, created_at',
            dailyLogEquipment: 'id, business_id, daily_log_id, equipment_id, crew_member_id, hours, created_at',
            dailyLogMaterials: 'id, business_id, daily_log_id, name, quantity, cost, created_at',
            dailyLogImages: 'id, business_id, daily_log_id, media_id, url, created_at',
            crews: 'id, business_id, leader_id, name, specialty, status, created_at',
            crewMembers: 'id, business_id, name, role, status, experience, created_at',
            crewMemberAssignments: 'id, business_id, crew_id, crew_member_id, created_at',
            projectCrews: 'id, business_id, crew_id, project_id, start_date, end_date, created_at',
            clientContacts: 'id, business_id, client_id, name, email, phone, is_primary, created_at',
            clientInteractions: 'id, business_id, client_id, date, type, staff, follow_up_date, created_at',
            projectMilestones: 'id, business_id, project_id, name, due_date, status, created_at',
            projectIssues: 'id, business_id, project_id, title, status, priority, reported_date, assigned_to, created_at',
            equipmentAssignments: 'id, business_id, equipment_id, crew_id, project_id, start_date, end_date, status, created_at',
            equipmentMaintenance: 'id, business_id, equipment_id, maintenance_date, maintenance_type, maintenance_status, created_at',
            equipmentSpecifications: 'id, business_id, equipment_id, name, value, created_at',
            equipmentUsage: 'id, business_id, equipment_id, project_id, crew_id, start_date, end_date, hours_used, created_at',
            invoices: 'id, business_id, project_id, client_id, invoice_number, status, due_date, total_amount, created_at',
            invoiceItems: 'id, business_id, invoice_id, description, quantity, rate, amount, created_at',
            stripeInvoices: 'id, business_id, stripe_invoice_id, status, created_at',
            stripePaymentEvents: 'id, business_id, stripe_event_id, event_type, created_at',
            media: 'id, business_id, project_id, name, type, size, uploaded_by, uploaded_at, created_at',
            mediaLinks: 'id, business_id, media_id, linked_id, linked_type, created_at',
            mediaMetadata: 'id, business_id, media_id, key, value, created_at',
            mediaTags: 'id, business_id, media_id, tag, created_at',
            mediaUploadQueue: 'id, businessId, uploadStatus, createdAt, [uploadStatus+createdAt]',
            syncQueue: 'id, table, businessId, timestamp, [synced+timestamp]',
            syncMetadata: 'id, businessId, table, lastSync',
            userBusinessMappings: 'userId, businessId'
        });

        // Version 14: Document System (Phase 7) - documents management and file handling
        this.version(14).stores({
            businesses: 'id, name, owner_id, business_type, created_at',
            users: 'id, auth_id, business_id, email, first_name, last_name, role, status',
            businessSubscriptions: 'id, business_id, plan_id, status, created_at',
            projects: 'id, business_id, client_id, name, type, status, start_date, end_date, manager_id, created_at',
            clients: 'id, business_id, name, type, status, contact_email, contact_name, created_at',
            equipment: 'id, business_id, name, type, status, condition, location, serial_number, created_at',
            tasks: 'id, business_id, project_id, name, status, priority, assigned_to, start_date, end_date, created_at',
            subtasks: 'id, business_id, task_id, name, status, priority, assigned_to, created_at',
            taskNotes: 'id, business_id, task_id, author_id, content, date, created_at',
            taskDependencies: 'id, business_id, task_id, dependency_on_task_id, dependency_type, created_at',
            dailyLogs: 'id, business_id, project_id, crew_id, author_id, date, start_time, end_time, created_at',
            dailyLogEquipment: 'id, business_id, daily_log_id, equipment_id, crew_member_id, hours, created_at',
            dailyLogMaterials: 'id, business_id, daily_log_id, name, quantity, cost, created_at',
            dailyLogImages: 'id, business_id, daily_log_id, media_id, url, created_at',
            crews: 'id, business_id, leader_id, name, specialty, status, created_at',
            crewMembers: 'id, business_id, name, role, status, experience, created_at',
            crewMemberAssignments: 'id, business_id, crew_id, crew_member_id, created_at',
            projectCrews: 'id, business_id, crew_id, project_id, start_date, end_date, created_at',
            clientContacts: 'id, business_id, client_id, name, email, phone, is_primary, created_at',
            clientInteractions: 'id, business_id, client_id, date, type, staff, follow_up_date, created_at',
            projectMilestones: 'id, business_id, project_id, name, due_date, status, created_at',
            projectIssues: 'id, business_id, project_id, title, status, priority, reported_date, assigned_to, created_at',
            equipmentAssignments: 'id, business_id, equipment_id, crew_id, project_id, start_date, end_date, status, created_at',
            equipmentMaintenance: 'id, business_id, equipment_id, maintenance_date, maintenance_type, maintenance_status, created_at',
            equipmentSpecifications: 'id, business_id, equipment_id, name, value, created_at',
            equipmentUsage: 'id, business_id, equipment_id, project_id, crew_id, start_date, end_date, hours_used, created_at',
            invoices: 'id, business_id, project_id, client_id, invoice_number, status, due_date, total_amount, created_at',
            invoiceItems: 'id, business_id, invoice_id, description, quantity, rate, amount, created_at',
            stripeInvoices: 'id, business_id, stripe_invoice_id, status, created_at',
            stripePaymentEvents: 'id, business_id, stripe_event_id, event_type, created_at',
            media: 'id, business_id, project_id, name, type, size, uploaded_by, uploaded_at, created_at',
            mediaLinks: 'id, business_id, media_id, linked_id, linked_type, created_at',
            mediaMetadata: 'id, business_id, media_id, key, value, created_at',
            mediaTags: 'id, business_id, media_id, tag, created_at',
            mediaUploadQueue: 'id, businessId, uploadStatus, createdAt, [uploadStatus+createdAt]',
            documents: 'id, business_id, project_id, name, type, url, media_id, size, created_at, [business_id+project_id], [business_id+type], [business_id+name]',
            syncQueue: 'id, table, businessId, timestamp, [synced+timestamp]',
            syncMetadata: 'id, businessId, table, lastSync',
            userBusinessMappings: 'userId, businessId'
        });

        // Version 15 - Add invoice automation rules
        this.version(15).stores({
            businesses: 'id, name, owner_id, business_type, created_at',
            users: 'id, auth_id, business_id, email, first_name, last_name, role, status',
            businessSubscriptions: 'id, business_id, plan_id, status, created_at',
            projects: 'id, business_id, client_id, name, type, status, start_date, end_date, manager_id, created_at',
            clients: 'id, business_id, name, type, status, contact_email, contact_name, created_at',
            equipment: 'id, business_id, name, type, status, condition, location, serial_number, created_at',
            tasks: 'id, business_id, project_id, name, status, priority, assigned_to, start_date, end_date, created_at',
            subtasks: 'id, business_id, task_id, name, status, priority, assigned_to, created_at',
            taskNotes: 'id, business_id, task_id, author_id, content, date, created_at',
            taskDependencies: 'id, business_id, task_id, dependency_on_task_id, dependency_type, created_at',
            dailyLogs: 'id, business_id, project_id, crew_id, author_id, date, start_time, end_time, created_at',
            dailyLogEquipment: 'id, business_id, daily_log_id, equipment_id, crew_member_id, hours, created_at',
            dailyLogMaterials: 'id, business_id, daily_log_id, name, quantity, cost, created_at',
            dailyLogImages: 'id, business_id, daily_log_id, media_id, url, created_at',
            crews: 'id, business_id, leader_id, name, specialty, status, created_at',
            crewMembers: 'id, business_id, name, role, status, experience, created_at',
            crewMemberAssignments: 'id, business_id, crew_id, crew_member_id, created_at',
            projectCrews: 'id, business_id, crew_id, project_id, start_date, end_date, created_at',
            clientContacts: 'id, business_id, client_id, name, email, phone, is_primary, created_at',
            clientInteractions: 'id, business_id, client_id, date, type, staff, follow_up_date, created_at',
            projectMilestones: 'id, business_id, project_id, name, due_date, status, created_at',
            projectIssues: 'id, business_id, project_id, title, status, priority, reported_date, assigned_to, created_at',
            equipmentAssignments: 'id, business_id, equipment_id, crew_id, project_id, start_date, end_date, status, created_at',
            equipmentMaintenance: 'id, business_id, equipment_id, maintenance_date, maintenance_type, maintenance_status, created_at',
            equipmentSpecifications: 'id, business_id, equipment_id, name, value, created_at',
            equipmentUsage: 'id, business_id, equipment_id, project_id, crew_id, start_date, end_date, hours_used, created_at',
            invoices: 'id, business_id, project_id, client_id, invoice_number, status, due_date, total_amount, created_at',
            invoiceItems: 'id, business_id, invoice_id, description, quantity, rate, amount, created_at',
            invoiceAutomationRules: 'id, businessId, clientId, projectId, ruleType, isActive, createdAt',
            stripeInvoices: 'id, business_id, stripe_invoice_id, status, created_at',
            stripePaymentEvents: 'id, business_id, stripe_event_id, event_type, created_at',
            media: 'id, business_id, project_id, name, type, size, uploaded_by, uploaded_at, created_at',
            mediaLinks: 'id, business_id, media_id, linked_id, linked_type, created_at',
            mediaMetadata: 'id, business_id, media_id, key, value, created_at',
            mediaTags: 'id, business_id, media_id, tag, created_at',
            mediaUploadQueue: 'id, businessId, uploadStatus, createdAt, [uploadStatus+createdAt]',
            documents: 'id, business_id, project_id, name, type, url, media_id, size, created_at, [business_id+project_id], [business_id+type], [business_id+name]',
            syncQueue: 'id, table, businessId, timestamp, [synced+timestamp]',
            syncMetadata: 'id, businessId, table, lastSync',
            userBusinessMappings: 'userId, businessId'
        });
    }
}

// Create singleton instance
export const db = new JobSightOfflineDB();

// Helper functions for business operations
export class BusinessOfflineManager {

    /**
     * Add business to local database
     */
    static async addBusiness(business: Business): Promise<void> {
        await db.businesses.put(business);
    }

    /**
     * Get business by ID from local database
     */
    static async getBusinessById(businessId: string): Promise<Business | undefined> {
        return await db.businesses.get(businessId);
    }

    /**
     * Get business by owner ID
     */
    static async getBusinessByOwnerId(ownerId: string): Promise<Business | undefined> {
        return await db.businesses.where('owner_id').equals(ownerId).first();
    }

    /**
     * Update business in local database
     */
    static async updateBusiness(businessId: string, updates: Partial<Business>): Promise<void> {
        await db.businesses.update(businessId, updates);
    }

    /**
     * Delete business from local database
     */
    static async deleteBusiness(businessId: string): Promise<void> {
        await db.businesses.delete(businessId);
    }

    /**
     * Add operation to sync queue
     */
    static async addToSyncQueue(
        table: string,
        operation: 'insert' | 'update' | 'delete',
        data: any,
        businessId: string,
        userId?: string
    ): Promise<string> {
        const id = `${table}_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await db.syncQueue.add({
            id,
            table,
            operation,
            data,
            businessId,
            userId,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        });

        // Trigger background sync if service worker is available
        if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                if ('sync' in registration) {
                    await (registration as any).sync.register('background-sync');
                }
            } catch (error) {
                console.error('Failed to register background sync:', error);
            }
        }

        return id;
    }

    /**
     * Get pending sync operations
     */
    static async getPendingSyncOperations(businessId?: string): Promise<any[]> {
        let query = db.syncQueue.filter(item => item.synced === false);

        if (businessId) {
            query = query.and(item => item.businessId === businessId);
        }

        return await query.toArray();
    }

    /**
     * Mark sync operation as completed
     */
    static async markSyncCompleted(syncId: string): Promise<void> {
        await db.syncQueue.update(syncId, { synced: true });
    }

    /**
     * Remove completed sync operations (cleanup)
     */
    static async cleanupSyncQueue(): Promise<void> {
        const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
        await db.syncQueue.filter(item =>
            item.synced === true && item.timestamp < cutoff
        ).delete();
    }

    /**
     * Set user-business mapping for efficient offline lookup
     */
    static async setUserBusinessMapping(
        userId: string,
        businessId: string,
        role: string = 'owner'
    ): Promise<void> {
        await db.userBusinessMappings.put({
            userId,
            businessId,
            role,
            lastUpdated: Date.now()
        });
    }

    /**
     * Get business ID for a user
     */
    static async getBusinessIdForUser(userId: string): Promise<string | undefined> {
        const mapping = await db.userBusinessMappings.get(userId);
        return mapping?.businessId;
    }

    /**
     * Update sync metadata
     */
    static async updateSyncMetadata(
        businessId: string,
        table: string,
        checksum?: string
    ): Promise<void> {
        const id = `${businessId}_${table}`;
        await db.syncMetadata.put({
            id,
            lastSync: Date.now(),
            businessId,
            table,
            checksum
        });
    }

    /**
     * Get last sync time for a table
     */
    static async getLastSyncTime(businessId: string, table: string): Promise<number | undefined> {
        const id = `${businessId}_${table}`;
        const metadata = await db.syncMetadata.get(id);
        return metadata?.lastSync;
    }

    /**
     * Check if we have fresh data (within threshold)
     */
    static async hasFreshData(
        businessId: string,
        table: string,
        maxAge: number = 5 * 60 * 1000 // 5 minutes
    ): Promise<boolean> {
        const lastSync = await this.getLastSyncTime(businessId, table);
        if (!lastSync) return false;

        return (Date.now() - lastSync) < maxAge;
    }

    /**
     * Get all businesses for a specific user (should typically return 1 business)
     * This enforces user-scoped data access
     */
    static async getBusinessesForUser(userId: string): Promise<Business[]> {
        // Get user's business ID from mapping
        const businessId = await this.getBusinessIdForUser(userId);
        if (businessId) {
            const business = await this.getBusinessById(businessId);
            return business ? [business] : [];
        }

        // Fallback: get business where user is owner
        const business = await this.getBusinessByOwnerId(userId);
        if (business) {
            // Create mapping for future use
            await this.setUserBusinessMapping(userId, business.id, 'owner');
            return [business];
        }

        return [];
    }

    /**
     * Validate that a user has access to a specific business
     */
    static async validateUserAccess(userId: string, businessId: string): Promise<boolean> {
        // Check user-business mapping
        const userBusinessId = await this.getBusinessIdForUser(userId);
        if (userBusinessId === businessId) {
            return true;
        }

        // Check if user is owner
        const business = await this.getBusinessById(businessId);
        if (business && business.owner_id === userId) {
            // Create mapping if it doesn't exist
            await this.setUserBusinessMapping(userId, businessId, 'owner');
            return true;
        }

        return false;
    }

    /**
     * Clear all business data (for user logout or data reset)
     * Only clears data for the specified user
     */
    static async clearUserBusinessData(userId: string): Promise<void> {
        const userBusinesses = await this.getBusinessesForUser(userId);

        for (const business of userBusinesses) {
            await this.deleteBusiness(business.id);
            await this.clearSyncMetadata(business.id, 'businesses');
        }

        // Clear user mappings
        await db.userBusinessMappings.where('userId').equals(userId).delete();
    }

    /**
     * Clear sync metadata for a specific business and table
     */
    static async clearSyncMetadata(businessId: string, table: string): Promise<void> {
        await db.syncMetadata
            .where('[businessId+table]')
            .equals([businessId, table])
            .delete();
    }
}

// Export database instance
export default db;
