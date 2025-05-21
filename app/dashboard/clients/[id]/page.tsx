"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

// Mock data for clients (same as in the clients page)
const clientsData = {
    client1: {
        id: "client1",
        name: "Oakridge Development Corp",
        type: "Commercial Developer",
        contactName: "Robert Chen",
        contactEmail: "robert.chen@oakridge.com",
        contactPhone: "(555) 123-4567",
        address: "1200 Market Street, Suite 500, Philadelphia, PA 19107",
        status: "active",
        totalProjects: 3,
        activeProjects: 2,
        totalValue: 1250000,
        image: "/client-logos/oakridge-development.png",
        notes: "Long-term client since 2020. Prefers weekly progress updates.",
        website: "https://www.oakridgedevelopment.com",
        industry: "Real Estate Development",
        taxId: "12-3456789",
        billingContact: {
            name: "Lisa Wong",
            email: "accounting@oakridge.com",
            phone: "(555) 123-4570",
        },
    },
    client2: {
        id: "client2",
        name: "Riverside Properties LLC",
        type: "Residential Developer",
        contactName: "Sarah Johnson",
        contactEmail: "sjohnson@riversideproperties.com",
        contactPhone: "(555) 234-5678",
        address: "450 Waterfront Drive, Pittsburgh, PA 15222",
        status: "active",
        totalProjects: 2,
        activeProjects: 1,
        totalValue: 850000,
        image: "/client-logos/riverside-properties.png",
        notes: "Focused on high-end residential developments. Very detail-oriented.",
        website: "https://www.riversideproperties.com",
        industry: "Residential Real Estate",
        taxId: "23-4567890",
        billingContact: {
            name: "Mark Davis",
            email: "accounting@riversideproperties.com",
            phone: "(555) 234-5680",
        },
    },
    client3: {
        id: "client3",
        name: "Metro City Government",
        type: "Government",
        contactName: "Michael Williams",
        contactEmail: "m.williams@metrocity.gov",
        contactPhone: "(555) 345-6789",
        address: "100 City Hall Plaza, Metro City, PA 18001",
        status: "active",
        totalProjects: 1,
        activeProjects: 1,
        totalValue: 2750000,
        image: "/client-logos/metro-city-government.png",
        notes: "Requires detailed documentation and strict adherence to regulations.",
        website: "https://www.metrocity.gov",
        industry: "Municipal Government",
        taxId: "Government Entity",
        billingContact: {
            name: "Patricia Moore",
            email: "finance@metrocity.gov",
            phone: "(555) 345-6790",
        },
    },
    client4: {
        id: "client4",
        name: "Greenfield Homes",
        type: "Residential Builder",
        contactName: "Jessica Martinez",
        contactEmail: "jmartinez@greenfieldhomes.com",
        contactPhone: "(555) 456-7890",
        address: "789 Builder Way, Greenfield, PA 17025",
        status: "inactive",
        totalProjects: 4,
        activeProjects: 0,
        totalValue: 1450000,
        image: "/client-logos/greenfield-homes.png",
        notes: "Previous projects completed successfully. Currently no active projects.",
        website: "https://www.greenfieldhomes.com",
        industry: "Residential Construction",
        taxId: "34-5678901",
        billingContact: {
            name: "Thomas Brown",
            email: "accounting@greenfieldhomes.com",
            phone: "(555) 456-7895",
        },
    },
    client5: {
        id: "client5",
        name: "Sunrise Senior Living",
        type: "Healthcare",
        contactName: "David Thompson",
        contactEmail: "dthompson@sunrisesenior.com",
        contactPhone: "(555) 567-8901",
        address: "2500 Sunrise Boulevard, Harrisburg, PA 17110",
        status: "active",
        totalProjects: 1,
        activeProjects: 1,
        totalValue: 3200000,
        image: "/client-logos/sunrise-senior-living.png",
        notes: "Specialized requirements for senior living facilities. Strict safety protocols.",
        website: "https://www.sunriseseniorliving.com",
        industry: "Healthcare & Senior Living",
        taxId: "45-6789012",
        billingContact: {
            name: "Jennifer White",
            email: "finance@sunrisesenior.com",
            phone: "(555) 567-8905",
        },
    },
    client6: {
        id: "client6",
        name: "TechHub Innovations",
        type: "Commercial",
        contactName: "Amanda Lee",
        contactEmail: "alee@techhub.com",
        contactPhone: "(555) 678-9012",
        address: "350 Technology Drive, Pittsburgh, PA 15219",
        status: "active",
        totalProjects: 1,
        activeProjects: 1,
        totalValue: 1850000,
        image: "/client-logos/techhub-innovations.png",
        notes: "Tech company with specific requirements for office space. Emphasis on modern design.",
        website: "https://www.techhubinnovations.com",
        industry: "Technology",
        taxId: "56-7890123",
        billingContact: {
            name: "Kevin Park",
            email: "finance@techhub.com",
            phone: "(555) 678-9015",
        },
    },
    client7: {
        id: "client7",
        name: "Parkview School District",
        type: "Education",
        contactName: "Thomas Wilson",
        contactEmail: "twilson@parkviewsd.edu",
        contactPhone: "(555) 789-0123",
        address: "400 Education Lane, Parkview, PA 16802",
        status: "active",
        totalProjects: 2,
        activeProjects: 1,
        totalValue: 4500000,
        image: "/client-logos/parkview-school-district.png",
        notes: "School renovation projects. Work must be scheduled around academic calendar.",
        website: "https://www.parkviewsd.edu",
        industry: "Education",
        taxId: "Educational Institution",
        billingContact: {
            name: "Susan Miller",
            email: "finance@parkviewsd.edu",
            phone: "(555) 789-0125",
        },
    },
    client8: {
        id: "client8",
        name: "Mountainside Resorts",
        type: "Hospitality",
        contactName: "Jennifer Adams",
        contactEmail: "jadams@mountainside.com",
        contactPhone: "(555) 890-1234",
        address: "1800 Mountain Road, Seven Springs, PA 15622",
        status: "prospect",
        totalProjects: 0,
        activeProjects: 0,
        totalValue: 0,
        image: "/client-logos/mountainside-resorts.png",
        notes: "Potential client interested in resort expansion. Initial meetings conducted.",
        website: "https://www.mountainsideresorts.com",
        industry: "Hospitality & Tourism",
        taxId: "67-8901234",
        billingContact: {
            name: "Robert Taylor",
            email: "accounting@mountainside.com",
            phone: "(555) 890-1240",
        },
    },
    client9: {
        id: "client9",
        name: "Eastside Community Center",
        type: "Non-Profit",
        contactName: "Marcus Johnson",
        contactEmail: "mjohnson@eastsidecenter.org",
        contactPhone: "(555) 901-2345",
        address: "500 Community Way, Philadelphia, PA 19122",
        status: "active",
        totalProjects: 1,
        activeProjects: 1,
        totalValue: 950000,
        image: "/client-logos/eastside-community-center.png",
        notes: "Grant-funded project with strict budget constraints. Community involvement important.",
        website: "https://www.eastsidecenter.org",
        industry: "Non-Profit & Community Services",
        taxId: "Non-Profit 501(c)(3)",
        billingContact: {
            name: "Tanya Rodriguez",
            email: "finance@eastsidecenter.org",
            phone: "(555) 901-2350",
        },
    },
    client10: {
        id: "client10",
        name: "Retail Plaza Investments",
        type: "Commercial Developer",
        contactName: "Sophia Garcia",
        contactEmail: "sgarcia@retailplaza.com",
        contactPhone: "(555) 012-3456",
        address: "2200 Shopping Center Blvd, Allentown, PA 18104",
        status: "inactive",
        totalProjects: 3,
        activeProjects: 0,
        totalValue: 2100000,
        image: "/client-logos/retail-plaza-investments.png",
        notes: "Previous retail development projects. Currently evaluating future opportunities.",
        website: "https://www.retailplazainvestments.com",
        industry: "Commercial Real Estate",
        taxId: "78-9012345",
        billingContact: {
            name: "Daniel Kim",
            email: "accounting@retailplaza.com",
            phone: "(555) 012-3460",
        },
    },
}

// Mock data for client projects
const clientProjects = {
    client1: [
        {
            id: "proj1",
            name: "Main Street Development",
            status: "in-progress",
            startDate: "2025-01-15",
            endDate: "2025-08-30",
            value: 750000,
            description: "Mixed-use development with retail and office space.",
            progress: 45,
        },
        {
            id: "proj2",
            name: "Oakridge Office Tower",
            status: "in-progress",
            startDate: "2024-11-10",
            endDate: "2025-12-15",
            value: 1200000,
            description: "12-story office building in downtown business district.",
            progress: 30,
        },
        {
            id: "proj3",
            name: "Westside Retail Center",
            status: "completed",
            startDate: "2023-05-20",
            endDate: "2024-06-30",
            value: 850000,
            description: "Shopping center with 15 retail units and parking facilities.",
            progress: 100,
        },
    ],
    client2: [
        {
            id: "proj4",
            name: "Riverside Apartments",
            status: "in-progress",
            startDate: "2024-09-01",
            endDate: "2025-11-30",
            value: 2200000,
            description: "Luxury apartment complex with 45 units and amenities.",
            progress: 60,
        },
        {
            id: "proj5",
            name: "Lakeside Townhomes",
            status: "completed",
            startDate: "2023-03-15",
            endDate: "2024-05-20",
            value: 1800000,
            description: "Development of 12 high-end townhomes with waterfront views.",
            progress: 100,
        },
    ],
    client3: [
        {
            id: "proj6",
            name: "Downtown Project",
            status: "in-progress",
            startDate: "2025-02-01",
            endDate: "2026-03-30",
            value: 3500000,
            description: "City center revitalization project including infrastructure upgrades.",
            progress: 25,
        },
    ],
    client4: [
        {
            id: "proj7",
            name: "Greenfield Estates Phase 1",
            status: "completed",
            startDate: "2022-06-10",
            endDate: "2023-08-15",
            value: 1200000,
            description: "Development of 20 single-family homes in suburban community.",
            progress: 100,
        },
        {
            id: "proj8",
            name: "Greenfield Estates Phase 2",
            status: "completed",
            startDate: "2023-09-01",
            endDate: "2024-10-30",
            value: 1350000,
            description: "Extension of residential development with 18 additional homes.",
            progress: 100,
        },
        {
            id: "proj9",
            name: "Meadowbrook Duplexes",
            status: "completed",
            startDate: "2022-04-15",
            endDate: "2023-05-20",
            value: 950000,
            description: "Construction of 10 duplex units in growing suburban area.",
            progress: 100,
        },
        {
            id: "proj10",
            name: "Hillside Condominiums",
            status: "completed",
            startDate: "2021-07-01",
            endDate: "2022-09-30",
            value: 1750000,
            description: "Development of 30-unit condominium complex with amenities.",
            progress: 100,
        },
    ],
    client5: [
        {
            id: "proj11",
            name: "Sunrise Senior Living Facility",
            status: "in-progress",
            startDate: "2024-11-15",
            endDate: "2026-01-30",
            value: 4200000,
            description: "Construction of 60-unit senior living facility with healthcare amenities.",
            progress: 35,
        },
    ],
    client6: [
        {
            id: "proj12",
            name: "TechHub Headquarters",
            status: "in-progress",
            startDate: "2025-01-10",
            endDate: "2025-12-15",
            value: 2850000,
            description: "Modern office building with specialized tech infrastructure and collaborative spaces.",
            progress: 20,
        },
    ],
    client7: [
        {
            id: "proj13",
            name: "Parkview High School Renovation",
            status: "in-progress",
            startDate: "2024-06-15",
            endDate: "2025-08-20",
            value: 3200000,
            description: "Comprehensive renovation of high school facilities including classrooms and athletic spaces.",
            progress: 70,
        },
        {
            id: "proj14",
            name: "Parkview Elementary Addition",
            status: "completed",
            startDate: "2023-05-01",
            endDate: "2024-04-30",
            value: 1850000,
            description: "Construction of new wing for elementary school with 12 classrooms.",
            progress: 100,
        },
    ],
    client9: [
        {
            id: "proj15",
            name: "Eastside Community Center Expansion",
            status: "in-progress",
            startDate: "2025-03-01",
            endDate: "2025-12-15",
            value: 1250000,
            description: "Expansion of community center facilities including gymnasium and multipurpose rooms.",
            progress: 40,
        },
    ],
    client10: [
        {
            id: "proj16",
            name: "Northside Shopping Plaza",
            status: "completed",
            startDate: "2022-08-15",
            endDate: "2023-10-30",
            value: 2750000,
            description: "Development of shopping plaza with anchor store and 15 retail units.",
            progress: 100,
        },
        {
            id: "proj17",
            name: "Eastwood Mall Renovation",
            status: "completed",
            startDate: "2021-09-01",
            endDate: "2022-07-30",
            value: 1850000,
            description: "Renovation of existing mall including facade updates and interior improvements.",
            progress: 100,
        },
        {
            id: "proj18",
            name: "Southtown Retail Park",
            status: "completed",
            startDate: "2023-02-15",
            endDate: "2024-04-30",
            value: 2250000,
            description: "Development of outdoor retail park with 12 commercial units and parking.",
            progress: 100,
        },
    ],
}

// Mock data for client contacts
const clientContacts = {
    client1: [
        {
            id: "contact1",
            name: "Robert Chen",
            title: "Development Director",
            email: "robert.chen@oakridge.com",
            phone: "(555) 123-4567",
            isPrimary: true,
        },
        {
            id: "contact2",
            name: "Lisa Wong",
            title: "Finance Manager",
            email: "accounting@oakridge.com",
            phone: "(555) 123-4570",
            isPrimary: false,
        },
        {
            id: "contact3",
            name: "James Wilson",
            title: "Project Coordinator",
            email: "j.wilson@oakridge.com",
            phone: "(555) 123-4575",
            isPrimary: false,
        },
    ],
    client2: [
        {
            id: "contact4",
            name: "Sarah Johnson",
            title: "CEO",
            email: "sjohnson@riversideproperties.com",
            phone: "(555) 234-5678",
            isPrimary: true,
        },
        {
            id: "contact5",
            name: "Mark Davis",
            title: "CFO",
            email: "accounting@riversideproperties.com",
            phone: "(555) 234-5680",
            isPrimary: false,
        },
        {
            id: "contact6",
            name: "Emily Taylor",
            title: "Project Manager",
            email: "e.taylor@riversideproperties.com",
            phone: "(555) 234-5685",
            isPrimary: false,
        },
    ],
    client3: [
        {
            id: "contact7",
            name: "Michael Williams",
            title: "Public Works Director",
            email: "m.williams@metrocity.gov",
            phone: "(555) 345-6789",
            isPrimary: true,
        },
        {
            id: "contact8",
            name: "Patricia Moore",
            title: "Finance Director",
            email: "finance@metrocity.gov",
            phone: "(555) 345-6790",
            isPrimary: false,
        },
        {
            id: "contact9",
            name: "Richard Thompson",
            title: "City Engineer",
            email: "r.thompson@metrocity.gov",
            phone: "(555) 345-6795",
            isPrimary: false,
        },
    ],
    client4: [
        {
            id: "contact10",
            name: "Jessica Martinez",
            title: "Operations Director",
            email: "jmartinez@greenfieldhomes.com",
            phone: "(555) 456-7890",
            isPrimary: true,
        },
        {
            id: "contact11",
            name: "Thomas Brown",
            title: "Financial Controller",
            email: "accounting@greenfieldhomes.com",
            phone: "(555) 456-7895",
            isPrimary: false,
        },
    ],
    client5: [
        {
            id: "contact12",
            name: "David Thompson",
            title: "Facilities Director",
            email: "dthompson@sunrisesenior.com",
            phone: "(555) 567-8901",
            isPrimary: true,
        },
        {
            id: "contact13",
            name: "Jennifer White",
            title: "Finance Manager",
            email: "finance@sunrisesenior.com",
            phone: "(555) 567-8905",
            isPrimary: false,
        },
        {
            id: "contact14",
            name: "Robert Garcia",
            title: "Operations Manager",
            email: "r.garcia@sunrisesenior.com",
            phone: "(555) 567-8910",
            isPrimary: false,
        },
    ],
    client6: [
        {
            id: "contact15",
            name: "Amanda Lee",
            title: "Facilities Manager",
            email: "alee@techhub.com",
            phone: "(555) 678-9012",
            isPrimary: true,
        },
        {
            id: "contact16",
            name: "Kevin Park",
            title: "Finance Director",
            email: "finance@techhub.com",
            phone: "(555) 678-9015",
            isPrimary: false,
        },
    ],
    client7: [
        {
            id: "contact17",
            name: "Thomas Wilson",
            title: "Superintendent",
            email: "twilson@parkviewsd.edu",
            phone: "(555) 789-0123",
            isPrimary: true,
        },
        {
            id: "contact18",
            name: "Susan Miller",
            title: "Business Manager",
            email: "finance@parkviewsd.edu",
            phone: "(555) 789-0125",
            isPrimary: false,
        },
        {
            id: "contact19",
            name: "John Davis",
            title: "Facilities Director",
            email: "j.davis@parkviewsd.edu",
            phone: "(555) 789-0130",
            isPrimary: false,
        },
    ],
    client8: [
        {
            id: "contact20",
            name: "Jennifer Adams",
            title: "Development Director",
            email: "jadams@mountainside.com",
            phone: "(555) 890-1234",
            isPrimary: true,
        },
        {
            id: "contact21",
            name: "Robert Taylor",
            title: "CFO",
            email: "accounting@mountainside.com",
            phone: "(555) 890-1240",
            isPrimary: false,
        },
    ],
    client9: [
        {
            id: "contact22",
            name: "Marcus Johnson",
            title: "Executive Director",
            email: "mjohnson@eastsidecenter.org",
            phone: "(555) 901-2345",
            isPrimary: true,
        },
        {
            id: "contact23",
            name: "Tanya Rodriguez",
            title: "Finance Director",
            email: "finance@eastsidecenter.org",
            phone: "(555) 901-2350",
            isPrimary: false,
        },
    ],
    client10: [
        {
            id: "contact24",
            name: "Sophia Garcia",
            title: "Development Director",
            email: "sgarcia@retailplaza.com",
            phone: "(555) 012-3456",
            isPrimary: true,
        },
        {
            id: "contact25",
            name: "Daniel Kim",
            title: "Financial Controller",
            email: "accounting@retailplaza.com",
            phone: "(555) 012-3460",
            isPrimary: false,
        },
        {
            id: "contact26",
            name: "Michelle Park",
            title: "Project Manager",
            email: "m.park@retailplaza.com",
            phone: "(555) 012-3465",
            isPrimary: false,
        },
    ],
}

// Mock data for client interactions
const clientInteractions = {
    client1: [
        {
            id: "int1",
            date: "2025-05-15",
            type: "Meeting",
            summary: "Project progress meeting for Main Street Development. Discussed timeline adjustments.",
            staff: "John Smith",
            followUpDate: "2025-05-22",
            followUpTask: "Send updated timeline document",
        },
        {
            id: "int2",
            date: "2025-05-10",
            type: "Call",
            summary: "Call with Robert Chen regarding budget adjustments for Oakridge Office Tower.",
            staff: "Sarah Johnson",
            followUpDate: null,
            followUpTask: null,
        },
        {
            id: "int3",
            date: "2025-05-01",
            type: "Email",
            summary: "Sent project update report for all active projects.",
            staff: "John Smith",
            followUpDate: null,
            followUpTask: null,
        },
        {
            id: "int4",
            date: "2025-04-20",
            type: "Meeting",
            summary: "Quarterly review meeting. Discussed all active projects and future opportunities.",
            staff: "Michael Davis",
            followUpDate: "2025-05-15",
            followUpTask: "Prepare proposal for potential new project",
        },
    ],
    client2: [
        {
            id: "int5",
            date: "2025-05-12",
            type: "Meeting",
            summary: "Site visit to Riverside Apartments. Reviewed construction progress.",
            staff: "Emily Clark",
            followUpDate: null,
            followUpTask: null,
        },
        {
            id: "int6",
            date: "2025-05-05",
            type: "Call",
            summary: "Call with Sarah Johnson about material selections for Riverside Apartments.",
            staff: "John Smith",
            followUpDate: "2025-05-15",
            followUpTask: "Send material samples",
        },
        {
            id: "int7",
            date: "2025-04-25",
            type: "Email",
            summary: "Sent monthly progress report and invoice.",
            staff: "Sarah Johnson",
            followUpDate: null,
            followUpTask: null,
        },
    ],
    client3: [
        {
            id: "int8",
            date: "2025-05-18",
            type: "Meeting",
            summary: "Project review meeting with city officials. Discussed permit requirements.",
            staff: "Michael Davis",
            followUpDate: "2025-05-25",
            followUpTask: "Submit revised permit applications",
        },
        {
            id: "int9",
            date: "2025-05-10",
            type: "Email",
            summary: "Sent updated project timeline and budget report.",
            staff: "John Smith",
            followUpDate: null,
            followUpTask: null,
        },
        {
            id: "int10",
            date: "2025-04-30",
            type: "Call",
            summary: "Call with Michael Williams regarding project specifications.",
            staff: "Emily Clark",
            followUpDate: "2025-05-05",
            followUpTask: "Send revised specifications document",
        },
    ],
    client4: [
        {
            id: "int11",
            date: "2025-04-15",
            type: "Meeting",
            summary: "Final project review for Hillside Condominiums. All items completed.",
            staff: "John Smith",
            followUpDate: null,
            followUpTask: null,
        },
        {
            id: "int12",
            date: "2025-04-01",
            type: "Call",
            summary: "Call with Jessica Martinez about potential future projects.",
            staff: "Michael Davis",
            followUpDate: "2025-06-01",
            followUpTask: "Schedule follow-up meeting to discuss new opportunities",
        },
    ],
    client5: [
        {
            id: "int13",
            date: "2025-05-16",
            type: "Meeting",
            summary: "Project progress meeting. Reviewed construction timeline and safety protocols.",
            staff: "Emily Clark",
            followUpDate: "2025-05-30",
            followUpTask: "Send updated safety compliance report",
        },
        {
            id: "int14",
            date: "2025-05-05",
            type: "Email",
            summary: "Sent monthly progress report with photos of completed work.",
            staff: "John Smith",
            followUpDate: null,
            followUpTask: null,
        },
        {
            id: "int15",
            date: "2025-04-25",
            type: "Call",
            summary: "Call with David Thompson regarding material substitutions.",
            staff: "Sarah Johnson",
            followUpDate: "2025-05-02",
            followUpTask: "Send material samples for approval",
        },
    ],
    client6: [
        {
            id: "int16",
            date: "2025-05-14",
            type: "Meeting",
            summary: "Design review meeting. Discussed technology infrastructure requirements.",
            staff: "Michael Davis",
            followUpDate: "2025-05-21",
            followUpTask: "Revise plans based on feedback",
        },
        {
            id: "int17",
            date: "2025-05-01",
            type: "Email",
            summary: "Sent project timeline and milestone report.",
            staff: "John Smith",
            followUpDate: null,
            followUpTask: null,
        },
    ],
    client7: [
        {
            id: "int18",
            date: "2025-05-17",
            type: "Meeting",
            summary: "Project coordination meeting. Discussed summer construction schedule.",
            staff: "Emily Clark",
            followUpDate: "2025-05-24",
            followUpTask: "Send revised summer schedule",
        },
        {
            id: "int19",
            date: "2025-05-10",
            type: "Call",
            summary: "Call with Thomas Wilson about budget adjustments.",
            staff: "Sarah Johnson",
            followUpDate: "2025-05-15",
            followUpTask: "Send revised budget proposal",
        },
        {
            id: "int20",
            date: "2025-04-30",
            type: "Email",
            summary: "Sent monthly progress report and invoice.",
            staff: "John Smith",
            followUpDate: null,
            followUpTask: null,
        },
    ],
    client8: [
        {
            id: "int21",
            date: "2025-05-10",
            type: "Meeting",
            summary: "Initial consultation meeting. Discussed potential resort expansion project.",
            staff: "Michael Davis",
            followUpDate: "2025-05-30",
            followUpTask: "Prepare preliminary proposal",
        },
        {
            id: "int22",
            date: "2025-04-25",
            type: "Call",
            summary: "Introductory call with Jennifer Adams. Discussed company capabilities.",
            staff: "John Smith",
            followUpDate: null,
            followUpTask: null,
        },
    ],
    client9: [
        {
            id: "int23",
            date: "2025-05-15",
            type: "Meeting",
            summary: "Project progress meeting. Reviewed budget constraints and community feedback.",
            staff: "Emily Clark",
            followUpDate: "2025-05-22",
            followUpTask: "Revise plans to accommodate budget constraints",
        },
        {
            id: "int24",
            date: "2025-05-05",
            type: "Email",
            summary: "Sent monthly progress report with budget update.",
            staff: "Sarah Johnson",
            followUpDate: null,
            followUpTask: null,
        },
        {
            id: "int25",
            date: "2025-04-20",
            type: "Call",
            summary: "Call with Marcus Johnson regarding community event scheduling.",
            staff: "John Smith",
            followUpDate: "2025-04-27",
            followUpTask: "Coordinate construction schedule around community events",
        },
    ],
    client10: [
        {
            id: "int26",
            date: "2025-04-15",
            type: "Meeting",
            summary: "Final project review for Southtown Retail Park. All items completed.",
            staff: "Michael Davis",
            followUpDate: null,
            followUpTask: null,
        },
        {
            id: "int27",
            date: "2025-04-01",
            type: "Call",
            summary: "Call with Sophia Garcia about potential future developments.",
            staff: "John Smith",
            followUpDate: "2025-06-15",
            followUpTask: "Schedule follow-up meeting to discuss new opportunities",
        },
    ],
}

// Status options with colors and labels
const statusOptions = {
    active: { label: "Active", color: "badge-success" },
    inactive: { label: "Inactive", color: "badge-neutral" },
    prospect: { label: "Prospect", color: "badge-warning" },
}

// Project status options with colors and labels
const projectStatusOptions = {
    "in-progress": { label: "In Progress", color: "badge-primary" },
    completed: { label: "Completed", color: "badge-success" },
    "on-hold": { label: "On Hold", color: "badge-warning" },
    cancelled: { label: "Cancelled", color: "badge-error" },
}

export default function ClientDetailPage() {
    const params = useParams()
    const router = useRouter()
    const clientId = params.id as string
    const [activeTab, setActiveTab] = useState("overview")
    const [showAddContactModal, setShowAddContactModal] = useState(false)
    const [showAddInteractionModal, setShowAddInteractionModal] = useState(false)
    const [newContact, setNewContact] = useState({
        name: "",
        title: "",
        email: "",
        phone: "",
        isPrimary: false,
    })
    const [newInteraction, setNewInteraction] = useState({
        type: "Meeting",
        summary: "",
        staff: "",
        followUpDate: "",
        followUpTask: "",
    })

    const client = clientsData[clientId as keyof typeof clientsData]
    const projects = clientProjects[clientId as keyof typeof clientProjects] || []
    const contacts = clientContacts[clientId as keyof typeof clientContacts] || []
    const interactions = clientInteractions[clientId as keyof typeof clientInteractions] || []

    // If client doesn't exist, redirect to clients page
    useEffect(() => {
        if (!client) {
            router.push("/dashboard/clients")
        }
    }, [client, router])

    if (!client) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        )
    }

    const handleAddContact = () => {
        // In a real app, this would update the database
        // For now, we'll just close the modal
        setShowAddContactModal(false)
    }

    const handleAddInteraction = () => {
        // In a real app, this would update the database
        // For now, we'll just close the modal
        setShowAddInteractionModal(false)
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/clients" className="btn btn-ghost btn-sm">
                            <i className="fas fa-arrow-left"></i>
                        </Link>
                        <h1 className="text-2xl font-bold">{client.name}</h1>
                        <div className={`badge ${statusOptions[client.status].color}`}>{statusOptions[client.status].label}</div>
                    </div>
                    <p className="text-base-content/70 mt-1">{client.type}</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-outline btn-sm">
                        <i className="fas fa-edit mr-2"></i> Edit
                    </button>
                    <button className="btn btn-primary btn-sm">
                        <i className="fas fa-file-invoice mr-2"></i> Create Invoice
                    </button>
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                            <i className="fas fa-ellipsis-v"></i>
                        </div>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                            <li>
                                <a onClick={() => setShowAddContactModal(true)}>
                                    <i className="fas fa-user-plus mr-2"></i> Add Contact
                                </a>
                            </li>
                            <li>
                                <a onClick={() => setShowAddInteractionModal(true)}>
                                    <i className="fas fa-comment-dots mr-2"></i> Log Interaction
                                </a>
                            </li>
                            <li>
                                <Link href="/dashboard/projects/new">
                                    <i className="fas fa-folder-plus mr-2"></i> New Project
                                </Link>
                            </li>
                            <li>
                                <a>
                                    <i className="fas fa-file-export mr-2"></i> Export Data
                                </a>
                            </li>
                            {client.status === "active" ? (
                                <li>
                                    <a className="text-error">
                                        <i className="fas fa-user-slash mr-2"></i> Mark as Inactive
                                    </a>
                                </li>
                            ) : (
                                <li>
                                    <a className="text-success">
                                        <i className="fas fa-user-check mr-2"></i> Mark as Active
                                    </a>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="tabs tabs-boxed mb-6">
                <a className={`tab ${activeTab === "overview" ? "tab-active" : ""}`} onClick={() => setActiveTab("overview")}>
                    Overview
                </a>
                <a className={`tab ${activeTab === "projects" ? "tab-active" : ""}`} onClick={() => setActiveTab("projects")}>
                    Projects
                </a>
                <a className={`tab ${activeTab === "contacts" ? "tab-active" : ""}`} onClick={() => setActiveTab("contacts")}>
                    Contacts
                </a>
                <a
                    className={`tab ${activeTab === "interactions" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("interactions")}
                >
                    Interactions
                </a>
                <a className={`tab ${activeTab === "documents" ? "tab-active" : ""}`} onClick={() => setActiveTab("documents")}>
                    Documents
                </a>
            </div>

            {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <div className="flex flex-col items-center mb-4">
                                    <div className="avatar">
                                        <div className="w-24 h-24 rounded-full bg-base-300 flex items-center justify-center">
                                            {client.image ? (
                                                <img src={client.image || "/placeholder.svg"} alt={`${client.name} logo`} />
                                            ) : (
                                                <span className="text-3xl font-bold">{client.name.charAt(0)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-bold mt-4">{client.name}</h2>
                                    <p className="text-base-content/70">{client.type}</p>
                                    <div className={`badge ${statusOptions[client.status].color} mt-2`}>
                                        {statusOptions[client.status].label}
                                    </div>
                                </div>

                                <div className="divider"></div>

                                <h3 className="text-lg font-semibold mb-2">Contact Information</h3>
                                <div className="space-y-2">
                                    <div className="flex items-start">
                                        <i className="fas fa-user-tie mt-1 w-5 text-primary"></i>
                                        <div className="ml-2">
                                            <p className="font-medium">{client.contactName}</p>
                                            <p className="text-sm text-base-content/70">Primary Contact</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <i className="fas fa-envelope mt-1 w-5 text-primary"></i>
                                        <div className="ml-2">
                                            <p>{client.contactEmail}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <i className="fas fa-phone mt-1 w-5 text-primary"></i>
                                        <div className="ml-2">
                                            <p>{client.contactPhone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <i className="fas fa-map-marker-alt mt-1 w-5 text-primary"></i>
                                        <div className="ml-2">
                                            <p>{client.address}</p>
                                        </div>
                                    </div>
                                    {client.website && (
                                        <div className="flex items-start">
                                            <i className="fas fa-globe mt-1 w-5 text-primary"></i>
                                            <div className="ml-2">
                                                <a href={client.website} target="_blank" rel="noopener noreferrer" className="link">
                                                    {client.website.replace(/^https?:\/\//, "")}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="divider"></div>

                                <h3 className="text-lg font-semibold mb-2">Business Information</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-base-content/70">Industry:</span>
                                        <span>{client.industry}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-base-content/70">Tax ID:</span>
                                        <span>{client.taxId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-base-content/70">Billing Contact:</span>
                                        <span>{client.billingContact?.name}</span>
                                    </div>
                                </div>

                                <div className="divider"></div>

                                <h3 className="text-lg font-semibold mb-2">Notes</h3>
                                <p className="text-sm">{client.notes}</p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="stat bg-base-100 shadow-sm rounded-lg">
                                <div className="stat-figure text-primary">
                                    <i className="fas fa-project-diagram text-3xl"></i>
                                </div>
                                <div className="stat-title">Active Projects</div>
                                <div className="stat-value">{client.activeProjects}</div>
                                <div className="stat-desc">Out of {client.totalProjects} total</div>
                            </div>
                            <div className="stat bg-base-100 shadow-sm rounded-lg">
                                <div className="stat-figure text-primary">
                                    <i className="fas fa-dollar-sign text-3xl"></i>
                                </div>
                                <div className="stat-title">Total Value</div>
                                <div className="stat-value">${(client.totalValue / 1000).toFixed(0)}K</div>
                                <div className="stat-desc">Lifetime project value</div>
                            </div>
                            <div className="stat bg-base-100 shadow-sm rounded-lg">
                                <div className="stat-figure text-primary">
                                    <i className="fas fa-users text-3xl"></i>
                                </div>
                                <div className="stat-title">Contacts</div>
                                <div className="stat-value">{contacts.length}</div>
                                <div className="stat-desc">Team members & representatives</div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-sm mb-6">
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Recent Projects</h3>
                                    <Link href="#" className="text-sm text-primary" onClick={() => setActiveTab("projects")}>
                                        View All
                                    </Link>
                                </div>

                                {projects.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="table table-zebra w-full">
                                            <thead>
                                                <tr>
                                                    <th>Project</th>
                                                    <th>Status</th>
                                                    <th>Timeline</th>
                                                    <th>Value</th>
                                                    <th>Progress</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {projects.slice(0, 3).map((project) => (
                                                    <tr key={project.id}>
                                                        <td>
                                                            <Link href={`/dashboard/projects/${project.id}`} className="font-medium">
                                                                {project.name}
                                                            </Link>
                                                            <div className="text-xs text-base-content/70">
                                                                {project.description.substring(0, 50)}...
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className={`badge ${projectStatusOptions[project.status].color}`}>
                                                                {projectStatusOptions[project.status].label}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="text-xs">
                                                                {new Date(project.startDate).toLocaleDateString()} -{" "}
                                                                {new Date(project.endDate).toLocaleDateString()}
                                                            </div>
                                                        </td>
                                                        <td>${project.value.toLocaleString()}</td>
                                                        <td>
                                                            <div className="flex items-center">
                                                                <progress
                                                                    className="progress progress-primary w-20 mr-2"
                                                                    value={project.progress}
                                                                    max="100"
                                                                ></progress>
                                                                <span className="text-xs">{project.progress}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <i className="fas fa-folder-open text-3xl text-base-content/30 mb-3"></i>
                                        <p className="text-base-content/70">No projects found for this client</p>
                                        <Link href="/dashboard/projects/new" className="btn btn-sm btn-primary mt-3">
                                            Create Project
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Recent Interactions</h3>
                                    <Link href="#" className="text-sm text-primary" onClick={() => setActiveTab("interactions")}>
                                        View All
                                    </Link>
                                </div>

                                {interactions.length > 0 ? (
                                    <div className="space-y-4">
                                        {interactions.slice(0, 3).map((interaction) => (
                                            <div key={interaction.id} className="flex gap-4 border-b pb-4 last:border-0">
                                                <div className="avatar placeholder">
                                                    <div className="bg-primary text-primary-content rounded-full w-12">
                                                        <span className="text-lg">
                                                            {interaction.type === "Meeting" && <i className="fas fa-handshake"></i>}
                                                            {interaction.type === "Call" && <i className="fas fa-phone"></i>}
                                                            {interaction.type === "Email" && <i className="fas fa-envelope"></i>}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <div className="font-medium">{interaction.type}</div>
                                                        <div className="text-sm text-base-content/70">
                                                            {new Date(interaction.date).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm mt-1">{interaction.summary}</p>
                                                    <div className="flex justify-between mt-2">
                                                        <div className="text-sm text-base-content/70">By: {interaction.staff}</div>
                                                        {interaction.followUpDate && (
                                                            <div className="text-sm text-primary">
                                                                Follow-up: {new Date(interaction.followUpDate).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <i className="fas fa-comments text-3xl text-base-content/30 mb-3"></i>
                                        <p className="text-base-content/70">No interactions recorded</p>
                                        <button className="btn btn-sm btn-primary mt-3" onClick={() => setShowAddInteractionModal(true)}>
                                            Log Interaction
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "projects" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Projects</h3>
                            <Link href="/dashboard/projects/new" className="btn btn-sm btn-primary">
                                <i className="fas fa-plus mr-2"></i> New Project
                            </Link>
                        </div>

                        {projects.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra w-full">
                                    <thead>
                                        <tr>
                                            <th>Project</th>
                                            <th>Status</th>
                                            <th>Timeline</th>
                                            <th>Value</th>
                                            <th>Progress</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projects.map((project) => (
                                            <tr key={project.id}>
                                                <td>
                                                    <Link href={`/dashboard/projects/${project.id}`} className="font-medium">
                                                        {project.name}
                                                    </Link>
                                                    <div className="text-xs text-base-content/70">{project.description.substring(0, 50)}...</div>
                                                </td>
                                                <td>
                                                    <div className={`badge ${projectStatusOptions[project.status].color}`}>
                                                        {projectStatusOptions[project.status].label}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="text-xs">
                                                        {new Date(project.startDate).toLocaleDateString()} -{" "}
                                                        {new Date(project.endDate).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td>${project.value.toLocaleString()}</td>
                                                <td>
                                                    <div className="flex items-center">
                                                        <progress
                                                            className="progress progress-primary w-20 mr-2"
                                                            value={project.progress}
                                                            max="100"
                                                        ></progress>
                                                        <span className="text-xs">{project.progress}%</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <Link href={`/dashboard/projects/${project.id}`} className="btn btn-xs btn-ghost">
                                                            <i className="fas fa-eye"></i>
                                                        </Link>
                                                        <button className="btn btn-xs btn-ghost">
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <i className="fas fa-folder-open text-4xl text-base-content/30 mb-4"></i>
                                <h3 className="text-xl font-semibold mb-2">No projects found</h3>
                                <p className="text-base-content/70 mb-4">This client doesn't have any projects yet</p>
                                <Link href="/dashboard/projects/new" className="btn btn-primary">
                                    Create Project
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "contacts" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Contacts</h3>
                            <button className="btn btn-sm btn-primary" onClick={() => setShowAddContactModal(true)}>
                                <i className="fas fa-plus mr-2"></i> Add Contact
                            </button>
                        </div>

                        {contacts.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra w-full">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Title</th>
                                            <th>Contact Information</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contacts.map((contact) => (
                                            <tr key={contact.id}>
                                                <td>
                                                    <div className="font-medium">{contact.name}</div>
                                                </td>
                                                <td>{contact.title}</td>
                                                <td>
                                                    <div>{contact.email}</div>
                                                    <div className="text-sm text-base-content/70">{contact.phone}</div>
                                                </td>
                                                <td>{contact.isPrimary ? <div className="badge badge-primary">Primary</div> : ""}</td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button className="btn btn-xs btn-ghost">
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button className="btn btn-xs btn-ghost text-error">
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <i className="fas fa-address-book text-4xl text-base-content/30 mb-4"></i>
                                <h3 className="text-xl font-semibold mb-2">No contacts found</h3>
                                <p className="text-base-content/70 mb-4">Add contacts to manage relationships with this client</p>
                                <button className="btn btn-primary" onClick={() => setShowAddContactModal(true)}>
                                    Add Contact
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "interactions" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Interactions</h3>
                            <button className="btn btn-sm btn-primary" onClick={() => setShowAddInteractionModal(true)}>
                                <i className="fas fa-plus mr-2"></i> Log Interaction
                            </button>
                        </div>

                        {interactions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra w-full">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Summary</th>
                                            <th>Staff</th>
                                            <th>Follow-up</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {interactions.map((interaction) => (
                                            <tr key={interaction.id}>
                                                <td>{new Date(interaction.date).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="flex items-center">
                                                        <span className="mr-2">
                                                            {interaction.type === "Meeting" && <i className="fas fa-handshake text-primary"></i>}
                                                            {interaction.type === "Call" && <i className="fas fa-phone text-primary"></i>}
                                                            {interaction.type === "Email" && <i className="fas fa-envelope text-primary"></i>}
                                                        </span>
                                                        {interaction.type}
                                                    </div>
                                                </td>
                                                <td>{interaction.summary}</td>
                                                <td>{interaction.staff}</td>
                                                <td>
                                                    {interaction.followUpDate ? (
                                                        <div>
                                                            <div className="text-sm">{new Date(interaction.followUpDate).toLocaleDateString()}</div>
                                                            <div className="text-xs text-base-content/70">{interaction.followUpTask}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-base-content/50">None</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button className="btn btn-xs btn-ghost">
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button className="btn btn-xs btn-ghost text-error">
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <i className="fas fa-comments text-4xl text-base-content/30 mb-4"></i>
                                <h3 className="text-xl font-semibold mb-2">No interactions recorded</h3>
                                <p className="text-base-content/70 mb-4">Log interactions to keep track of client communications</p>
                                <button className="btn btn-primary" onClick={() => setShowAddInteractionModal(true)}>
                                    Log Interaction
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "documents" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Documents</h3>
                            <button className="btn btn-sm btn-primary">
                                <i className="fas fa-upload mr-2"></i> Upload Document
                            </button>
                        </div>

                        <div className="text-center py-12">
                            <i className="fas fa-file-alt text-4xl text-base-content/30 mb-4"></i>
                            <h3 className="text-xl font-semibold mb-2">No documents found</h3>
                            <p className="text-base-content/70 mb-4">Upload documents to keep track of important files</p>
                            <button className="btn btn-primary">Upload Document</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Contact Modal */}
            {showAddContactModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Add New Contact</h3>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Name</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter contact name"
                                className="input input-bordered"
                                value={newContact.name}
                                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                            />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Title</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter job title"
                                className="input input-bordered"
                                value={newContact.title}
                                onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                            />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Email</span>
                            </label>
                            <input
                                type="email"
                                placeholder="Enter email address"
                                className="input input-bordered"
                                value={newContact.email}
                                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                            />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Phone</span>
                            </label>
                            <input
                                type="tel"
                                placeholder="Enter phone number"
                                className="input input-bordered"
                                value={newContact.phone}
                                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                            />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label cursor-pointer justify-start gap-2">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-primary"
                                    checked={newContact.isPrimary}
                                    onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                                />
                                <span className="label-text">Primary Contact</span>
                            </label>
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setShowAddContactModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleAddContact}>
                                Add Contact
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowAddContactModal(false)}></div>
                </div>
            )}

            {/* Add Interaction Modal */}
            {showAddInteractionModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Log New Interaction</h3>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Interaction Type</span>
                            </label>
                            <select
                                className="select select-bordered"
                                value={newInteraction.type}
                                onChange={(e) => setNewInteraction({ ...newInteraction, type: e.target.value })}
                            >
                                <option>Meeting</option>
                                <option>Call</option>
                                <option>Email</option>
                            </select>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Summary</span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered"
                                placeholder="Enter interaction summary"
                                value={newInteraction.summary}
                                onChange={(e) => setNewInteraction({ ...newInteraction, summary: e.target.value })}
                            ></textarea>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Staff Member</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter staff name"
                                className="input input-bordered"
                                value={newInteraction.staff}
                                onChange={(e) => setNewInteraction({ ...newInteraction, staff: e.target.value })}
                            />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Follow-up Date (Optional)</span>
                            </label>
                            <input
                                type="date"
                                className="input input-bordered"
                                value={newInteraction.followUpDate}
                                onChange={(e) => setNewInteraction({ ...newInteraction, followUpDate: e.target.value })}
                            />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Follow-up Task (Optional)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter follow-up task"
                                className="input input-bordered"
                                value={newInteraction.followUpTask}
                                onChange={(e) => setNewInteraction({ ...newInteraction, followUpTask: e.target.value })}
                            />
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setShowAddInteractionModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleAddInteraction}>
                                Log Interaction
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowAddInteractionModal(false)}></div>
                </div>
            )}
        </div>
    )
}
