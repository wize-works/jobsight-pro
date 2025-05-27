"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

// Mock data for equipment (same as in the equipment page)
const equipmentData = {
    eq1: {
        id: "eq1",
        name: "Excavator #103",
        type: "Heavy Equipment",
        make: "Caterpillar",
        model: "336",
        year: 2020,
        serialNumber: "CAT336-2020-103",
        status: "in-use",
        assignedTo: "Foundation Team",
        location: "Main Street Development",
        nextMaintenance: "2025-06-15",
        purchaseDate: "2020-03-12",
        purchasePrice: 250000,
        currentValue: 175000,
        image: "/large-yellow-excavator.png",
        description:
            "36-ton hydraulic excavator with a 271 hp engine. Features include air-conditioned cab, GPS tracking, and extended reach boom.",
        specifications: {
            "Engine Power": "271 hp",
            "Operating Weight": "36 tons",
            "Max Digging Depth": "24 ft",
            "Fuel Capacity": "155 gallons",
            "Hydraulic System": "Closed-center load sensing",
        },
        documents: [
            { name: "User Manual", type: "PDF", size: "8.5 MB" },
            { name: "Maintenance Schedule", type: "PDF", size: "1.2 MB" },
            { name: "Warranty Information", type: "PDF", size: "0.5 MB" },
        ],
    },
    eq2: {
        id: "eq2",
        name: "Bulldozer #87",
        type: "Heavy Equipment",
        make: "John Deere",
        model: "700K",
        year: 2019,
        serialNumber: "JD700K-2019-87",
        status: "available",
        assignedTo: null,
        location: "Equipment Yard",
        nextMaintenance: "2025-05-30",
        purchaseDate: "2019-06-20",
        purchasePrice: 180000,
        currentValue: 120000,
        image: "/powerful-bulldozer.png",
        description:
            "Medium-sized bulldozer with hydrostatic transmission and 130 hp engine. Equipped with 6-way blade and rear ripper attachment.",
        specifications: {
            "Engine Power": "130 hp",
            "Operating Weight": "15 tons",
            "Blade Capacity": "3.5 cubic yards",
            Undercarriage: "Sealed and lubricated track",
            Transmission: "Hydrostatic",
        },
        documents: [
            { name: "User Manual", type: "PDF", size: "7.2 MB" },
            { name: "Parts Catalog", type: "PDF", size: "12.5 MB" },
            { name: "Service Records", type: "PDF", size: "2.8 MB" },
        ],
    },
    eq3: {
        id: "eq3",
        name: "Cement Mixer #42",
        type: "Medium Equipment",
        make: "SANY",
        model: "SY204C-8",
        year: 2021,
        serialNumber: "SANY204C-2021-42",
        status: "in-use",
        assignedTo: "Foundation Team",
        location: "Main Street Development",
        nextMaintenance: "2025-07-10",
        purchaseDate: "2021-02-15",
        purchasePrice: 85000,
        currentValue: 70000,
        image: "/placeholder-tdvdz.png",
        description:
            "Truck-mounted concrete mixer with 8 cubic yard capacity. Features include automatic mixing control and high-efficiency water system.",
        specifications: {
            "Drum Capacity": "8 cubic yards",
            "Mixing Speed": "0-14 rpm",
            "Water Tank": "100 gallons",
            "Charging Height": "12 ft",
            "Discharge Height": "5 ft",
        },
        documents: [
            { name: "User Manual", type: "PDF", size: "5.1 MB" },
            { name: "Maintenance Guide", type: "PDF", size: "3.2 MB" },
        ],
    },
    eq4: {
        id: "eq4",
        name: "Forklift #29",
        type: "Medium Equipment",
        make: "Toyota",
        model: "8FGU25",
        year: 2022,
        serialNumber: "TOYO8FGU-2022-29",
        status: "maintenance",
        assignedTo: null,
        location: "Service Center",
        nextMaintenance: "2025-05-22",
        purchaseDate: "2022-01-10",
        purchasePrice: 35000,
        currentValue: 30000,
        image: "/warehouse-forklift-operation.png",
        description:
            "5,000 lb capacity industrial forklift with propane power. Features include ergonomic operator compartment and advanced safety systems.",
        specifications: {
            "Lift Capacity": "5,000 lbs",
            "Lift Height": "15 ft",
            "Power Source": "Propane",
            "Forward Speed": "10.5 mph",
            "Turning Radius": "7.5 ft",
        },
        documents: [
            { name: "User Manual", type: "PDF", size: "4.3 MB" },
            { name: "Safety Guidelines", type: "PDF", size: "1.8 MB" },
            { name: "Inspection Checklist", type: "PDF", size: "0.3 MB" },
        ],
    },
    eq5: {
        id: "eq5",
        name: "Generator #56",
        type: "Small Equipment",
        make: "Honda",
        model: "EU7000is",
        year: 2023,
        serialNumber: "HONDA-EU7000-2023-56",
        status: "in-use",
        assignedTo: "Electrical Team",
        location: "Downtown Project",
        nextMaintenance: "2025-08-05",
        purchaseDate: "2023-04-18",
        purchasePrice: 5500,
        currentValue: 4800,
        image: "/abstract-energy-flow.png",
        description:
            "7,000 watt inverter generator with electric start. Ultra-quiet operation and fuel efficient with eco-throttle system.",
        specifications: {
            "Maximum Output": "7,000 watts",
            "Fuel Tank": "5.1 gallons",
            "Run Time": "6.5 hours at full load",
            "Noise Level": "58 dB at rated load",
            Weight: "262 lbs",
        },
        documents: [
            { name: "User Manual", type: "PDF", size: "3.7 MB" },
            { name: "Troubleshooting Guide", type: "PDF", size: "1.5 MB" },
        ],
    },
    eq6: {
        id: "eq6",
        name: "Concrete Saw #17",
        type: "Small Equipment",
        make: "Husqvarna",
        model: "K770",
        year: 2022,
        serialNumber: "HUSQ-K770-2022-17",
        status: "available",
        assignedTo: null,
        location: "Equipment Yard",
        nextMaintenance: "2025-06-20",
        purchaseDate: "2022-05-30",
        purchasePrice: 1200,
        currentValue: 900,
        image: "/concrete-saw.png",
        description:
            "14-inch gas-powered concrete saw with 5 hp engine. Features include dust control system and ergonomic design.",
        specifications: {
            "Engine Power": "5 hp",
            "Blade Size": "14 inches",
            "Maximum Cutting Depth": "5 inches",
            Weight: "22 lbs",
            "Fuel Type": "Gas/oil mix",
        },
        documents: [
            { name: "User Manual", type: "PDF", size: "2.1 MB" },
            { name: "Blade Selection Guide", type: "PDF", size: "0.8 MB" },
        ],
    },
    eq7: {
        id: "eq7",
        name: "Backhoe Loader #64",
        type: "Heavy Equipment",
        make: "JCB",
        model: "3CX",
        year: 2021,
        serialNumber: "JCB3CX-2021-64",
        status: "in-use",
        assignedTo: "Framing Crew",
        location: "Riverside Apartments",
        nextMaintenance: "2025-07-15",
        purchaseDate: "2021-03-25",
        purchasePrice: 95000,
        currentValue: 80000,
        image: "/backhoe-loader.png",
        description:
            "Versatile backhoe loader with 91 hp engine. Features 4-wheel drive, extendable dipper, and climate-controlled cab.",
        specifications: {
            "Engine Power": "91 hp",
            "Operating Weight": "8.5 tons",
            "Max Dig Depth": "14.5 ft",
            "Loader Capacity": "1 cubic yard",
            "Fuel Capacity": "35 gallons",
        },
        documents: [
            { name: "User Manual", type: "PDF", size: "9.3 MB" },
            { name: "Maintenance Schedule", type: "PDF", size: "2.1 MB" },
            { name: "Operator Training", type: "PDF", size: "4.5 MB" },
        ],
    },
    eq8: {
        id: "eq8",
        name: "Air Compressor #38",
        type: "Medium Equipment",
        make: "Ingersoll Rand",
        model: "P185",
        year: 2020,
        serialNumber: "IR-P185-2020-38",
        status: "available",
        assignedTo: null,
        location: "Equipment Yard",
        nextMaintenance: "2025-06-10",
        purchaseDate: "2020-07-12",
        purchasePrice: 15000,
        currentValue: 10000,
        image: "/placeholder-wzca7.png",
        description:
            "185 CFM portable air compressor with diesel engine. Features include digital control panel and heavy-duty frame.",
        specifications: {
            "Air Delivery": "185 CFM",
            "Operating Pressure": "100 psi",
            Engine: "Diesel, 49 hp",
            "Fuel Capacity": "27 gallons",
            Weight: "2,450 lbs",
        },
        documents: [
            { name: "User Manual", type: "PDF", size: "6.2 MB" },
            { name: "Service Guide", type: "PDF", size: "3.8 MB" },
        ],
    },
    eq9: {
        id: "eq9",
        name: "Skid Steer #51",
        type: "Medium Equipment",
        make: "Bobcat",
        model: "S650",
        year: 2022,
        serialNumber: "BOB-S650-2022-51",
        status: "in-use",
        assignedTo: "Finishing Crew",
        location: "Johnson Residence",
        nextMaintenance: "2025-08-20",
        purchaseDate: "2022-02-28",
        purchasePrice: 45000,
        currentValue: 38000,
        image: "/placeholder.svg?height=200&width=200&query=skid+steer",
        description:
            "Vertical lift skid steer with 74 hp engine. Features include climate-controlled cab and multiple attachment capability.",
        specifications: {
            "Rated Capacity": "2,690 lbs",
            "Operating Weight": "8,327 lbs",
            "Engine Power": "74 hp",
            "Hydraulic Flow": "23 gpm",
            "Travel Speed": "7.1 mph",
        },
        documents: [
            { name: "User Manual", type: "PDF", size: "7.5 MB" },
            { name: "Attachment Guide", type: "PDF", size: "4.2 MB" },
            { name: "Maintenance Log", type: "PDF", size: "1.8 MB" },
        ],
    },
    eq10: {
        id: "eq10",
        name: "Scissor Lift #73",
        type: "Medium Equipment",
        make: "Genie",
        model: "GS-1930",
        year: 2021,
        serialNumber: "GENIE-GS1930-2021-73",
        status: "maintenance",
        assignedTo: null,
        location: "Service Center",
        nextMaintenance: "2025-05-25",
        purchaseDate: "2021-05-10",
        purchasePrice: 12000,
        currentValue: 9000,
        image: "/placeholder.svg?height=200&width=200&query=scissor+lift",
        description:
            "19-foot electric scissor lift with 500 lb capacity. Features include non-marking tires and fold-down guardrails.",
        specifications: {
            "Platform Height": "19 ft",
            "Weight Capacity": "500 lbs",
            "Power Source": "24V DC (4 batteries)",
            "Stowed Height": "6 ft 6 in",
            "Platform Size": "2 ft 6 in x 5 ft 10 in",
        },
        documents: [
            { name: "User Manual", type: "PDF", size: "5.3 MB" },
            { name: "Safety Guidelines", type: "PDF", size: "2.1 MB" },
            { name: "Pre-operation Inspection", type: "PDF", size: "0.7 MB" },
        ],
    },
    eq11: {
        id: "eq11",
        name: "Portable Welder #22",
        type: "Small Equipment",
        make: "Lincoln Electric",
        model: "Ranger 305 G",
        year: 2023,
        serialNumber: "LE-R305G-2023-22",
        status: "available",
        assignedTo: null,
        location: "Equipment Yard",
        nextMaintenance: "2025-09-05",
        purchaseDate: "2023-01-15",
        purchasePrice: 8000,
        currentValue: 7500,
        image: "/placeholder.svg?height=200&width=200&query=portable+welder",
        description:
            "Engine-driven welder/generator with 305 amp DC welding output. Features include 12,000 watt peak generator power.",
        specifications: {
            "Welding Output": "305 amps DC",
            "Generator Power": "12,000 watts peak",
            Engine: "Kohler 23 hp",
            "Fuel Capacity": "12 gallons",
            Weight: "745 lbs",
        },
        documents: [
            { name: "User Manual", type: "PDF", size: "4.8 MB" },
            { name: "Welding Guide", type: "PDF", size: "3.2 MB" },
        ],
    },
    eq12: {
        id: "eq12",
        name: "Boom Lift #45",
        type: "Heavy Equipment",
        make: "JLG",
        model: "600AJ",
        year: 2020,
        serialNumber: "JLG-600AJ-2020-45",
        status: "in-use",
        assignedTo: "Electrical Team",
        location: "Downtown Project",
        nextMaintenance: "2025-07-30",
        purchaseDate: "2020-04-20",
        purchasePrice: 65000,
        currentValue: 48000,
        image: "/placeholder.svg?height=200&width=200&query=boom+lift",
        description:
            "60-foot articulating boom lift with 4-wheel drive. Features include platform rotation and oscillating axle.",
        specifications: {
            "Platform Height": "60 ft",
            "Horizontal Reach": "39 ft 9 in",
            "Platform Capacity": "500 lbs",
            "Power Source": "Diesel",
            Weight: "23,700 lbs",
        },
        documents: [
            { name: "User Manual", type: "PDF", size: "8.7 MB" },
            { name: "Maintenance Schedule", type: "PDF", size: "2.4 MB" },
            { name: "Inspection Checklist", type: "PDF", size: "0.9 MB" },
        ],
    },
}

// Mock data for maintenance history
const maintenanceHistory = {
    eq1: [
        {
            id: "m1",
            date: "2025-03-15",
            type: "Scheduled",
            description: "250-hour service: Oil change, filter replacement, and general inspection",
            technician: "Mike Johnson",
            cost: 850,
            notes: "All systems functioning properly. Replaced worn hydraulic hose on boom cylinder.",
        },
        {
            id: "m2",
            date: "2024-12-10",
            type: "Scheduled",
            description: "500-hour service: Comprehensive fluid change and system check",
            technician: "Robert Smith",
            cost: 1250,
            notes: "Replaced fuel filters and air filters. Adjusted track tension.",
        },
        {
            id: "m3",
            date: "2024-09-05",
            type: "Repair",
            description: "Hydraulic system repair: Replaced leaking valve and seals",
            technician: "David Wilson",
            cost: 1800,
            notes: "Hydraulic system pressure tested after repair. Operating within specifications.",
        },
    ],
    eq2: [
        {
            id: "m4",
            date: "2025-02-20",
            type: "Scheduled",
            description: "Regular maintenance: Oil change and filter replacement",
            technician: "Robert Smith",
            cost: 650,
            notes: "Equipment in good condition. Blade edges showing wear but still serviceable.",
        },
        {
            id: "m5",
            date: "2024-11-15",
            type: "Repair",
            description: "Replaced damaged track section and adjusted tension",
            technician: "Mike Johnson",
            cost: 2200,
            notes: "Damage likely caused by operation on rocky terrain. Operator briefed on proper usage.",
        },
    ],
    eq3: [
        {
            id: "m6",
            date: "2025-04-05",
            type: "Scheduled",
            description: "Regular service: Oil change, greasing, and inspection",
            technician: "Sarah Davis",
            cost: 550,
            notes: "Drum rotation mechanism showing signs of wear. Schedule for replacement in next 3 months.",
        },
        {
            id: "m7",
            date: "2024-10-12",
            type: "Repair",
            description: "Water pump replacement and hose inspection",
            technician: "Robert Smith",
            cost: 950,
            notes: "All water delivery systems tested and functioning properly after repair.",
        },
    ],
    eq4: [
        {
            id: "m8",
            date: "2025-05-10",
            type: "Scheduled",
            description: "Regular maintenance and safety inspection",
            technician: "David Wilson",
            cost: 450,
            notes: "Currently in shop for hydraulic system repair. Leaking cylinder identified.",
        },
        {
            id: "m9",
            date: "2024-11-30",
            type: "Scheduled",
            description: "500-hour service: Comprehensive inspection and fluid change",
            technician: "Sarah Davis",
            cost: 750,
            notes: "Replaced worn forks and adjusted mast chain tension.",
        },
    ],
    eq5: [
        {
            id: "m10",
            date: "2025-02-15",
            type: "Scheduled",
            description: "Regular service: Oil change and filter replacement",
            technician: "Mike Johnson",
            cost: 250,
            notes: "Generator running smoothly. No issues identified.",
        },
    ],
    eq6: [
        {
            id: "m11",
            date: "2025-01-20",
            type: "Scheduled",
            description: "Blade replacement and general service",
            technician: "Robert Smith",
            cost: 350,
            notes: "New diamond blade installed. Air filter cleaned and engine tuned.",
        },
    ],
    eq7: [
        {
            id: "m12",
            date: "2025-03-10",
            type: "Scheduled",
            description: "250-hour service: Oil change and system check",
            technician: "David Wilson",
            cost: 750,
            notes: "Backhoe hydraulic system pressure tested. All systems nominal.",
        },
        {
            id: "m13",
            date: "2024-10-05",
            type: "Repair",
            description: "Replaced broken front loader cylinder",
            technician: "Mike Johnson",
            cost: 1650,
            notes: "Damage caused by overloading. Operator retrained on proper loading procedures.",
        },
    ],
    eq8: [
        {
            id: "m14",
            date: "2025-01-15",
            type: "Scheduled",
            description: "Regular maintenance: Oil change and air system check",
            technician: "Sarah Davis",
            cost: 450,
            notes: "Pressure relief valve adjusted. Air delivery within specifications.",
        },
    ],
    eq9: [
        {
            id: "m15",
            date: "2025-02-25",
            type: "Scheduled",
            description: "Regular service: Oil change and hydraulic system check",
            technician: "Robert Smith",
            cost: 550,
            notes: "Equipment in excellent condition. No issues found.",
        },
    ],
    eq10: [
        {
            id: "m16",
            date: "2025-05-15",
            type: "Repair",
            description: "Electrical system troubleshooting and repair",
            technician: "David Wilson",
            cost: 850,
            notes: "Currently in shop for electrical system repair. Control panel malfunctioning.",
        },
        {
            id: "m17",
            date: "2024-12-10",
            type: "Scheduled",
            description: "Regular maintenance and safety inspection",
            technician: "Sarah Davis",
            cost: 450,
            notes: "All safety systems tested and functioning properly.",
        },
    ],
    eq11: [
        {
            id: "m18",
            date: "2025-03-05",
            type: "Scheduled",
            description: "Regular service: Oil change and electrical check",
            technician: "Mike Johnson",
            cost: 350,
            notes: "Welder output tested and calibrated. Generator function verified.",
        },
    ],
    eq12: [
        {
            id: "m19",
            date: "2025-02-10",
            type: "Scheduled",
            description: "250-hour service: Comprehensive inspection",
            technician: "Robert Smith",
            cost: 950,
            notes: "Boom extension mechanism lubricated. Hydraulic system pressure tested.",
        },
        {
            id: "m20",
            date: "2024-09-15",
            type: "Repair",
            description: "Replaced damaged control panel and joystick",
            technician: "David Wilson",
            cost: 1750,
            notes: "Damage likely caused by impact. Operators reminded about proper storage procedures.",
        },
    ],
}

// Mock data for usage history
const usageHistory = {
    eq1: [
        {
            id: "u1",
            project: "Main Street Development",
            startDate: "2025-04-01",
            endDate: "2025-05-15",
            crew: "Foundation Team",
            hoursUsed: 210,
            fuelConsumed: 840,
        },
        {
            id: "u2",
            project: "Riverside Apartments",
            startDate: "2025-02-15",
            endDate: "2025-03-20",
            crew: "Foundation Team",
            hoursUsed: 185,
            fuelConsumed: 740,
        },
        {
            id: "u3",
            project: "Downtown Project",
            startDate: "2024-11-10",
            endDate: "2025-01-05",
            crew: "Foundation Team",
            hoursUsed: 320,
            fuelConsumed: 1280,
        },
    ],
    eq2: [
        {
            id: "u4",
            project: "Main Street Development",
            startDate: "2025-01-10",
            endDate: "2025-02-20",
            crew: "Foundation Team",
            hoursUsed: 230,
            fuelConsumed: 920,
        },
        {
            id: "u5",
            project: "Johnson Residence",
            startDate: "2024-10-15",
            endDate: "2024-11-30",
            crew: "Foundation Team",
            hoursUsed: 175,
            fuelConsumed: 700,
        },
    ],
    eq3: [
        {
            id: "u6",
            project: "Main Street Development",
            startDate: "2025-04-01",
            endDate: null,
            crew: "Foundation Team",
            hoursUsed: 85,
            fuelConsumed: 255,
        },
        {
            id: "u7",
            project: "Riverside Apartments",
            startDate: "2025-01-15",
            endDate: "2025-03-20",
            crew: "Foundation Team",
            hoursUsed: 210,
            fuelConsumed: 630,
        },
    ],
    eq4: [
        {
            id: "u8",
            project: "Equipment Yard",
            startDate: "2025-01-10",
            endDate: "2025-04-15",
            crew: "Various",
            hoursUsed: 320,
            fuelConsumed: 480,
        },
    ],
    eq5: [
        {
            id: "u9",
            project: "Downtown Project",
            startDate: "2025-04-01",
            endDate: null,
            crew: "Electrical Team",
            hoursUsed: 110,
            fuelConsumed: 165,
        },
        {
            id: "u10",
            project: "Riverside Apartments",
            startDate: "2025-02-15",
            endDate: "2025-03-20",
            crew: "Electrical Team",
            hoursUsed: 95,
            fuelConsumed: 142,
        },
    ],
    eq6: [
        {
            id: "u11",
            project: "Main Street Development",
            startDate: "2025-03-10",
            endDate: "2025-03-25",
            crew: "Foundation Team",
            hoursUsed: 45,
            fuelConsumed: 22,
        },
        {
            id: "u12",
            project: "Johnson Residence",
            startDate: "2025-02-05",
            endDate: "2025-02-15",
            crew: "Finishing Crew",
            hoursUsed: 30,
            fuelConsumed: 15,
        },
    ],
    eq7: [
        {
            id: "u13",
            project: "Riverside Apartments",
            startDate: "2025-04-01",
            endDate: null,
            crew: "Framing Crew",
            hoursUsed: 95,
            fuelConsumed: 380,
        },
        {
            id: "u14",
            project: "Main Street Development",
            startDate: "2025-01-15",
            endDate: "2025-03-20",
            crew: "Foundation Team",
            hoursUsed: 210,
            fuelConsumed: 840,
        },
    ],
    eq8: [
        {
            id: "u15",
            project: "Downtown Project",
            startDate: "2025-02-10",
            endDate: "2025-03-15",
            crew: "Various",
            hoursUsed: 120,
            fuelConsumed: 240,
        },
    ],
    eq9: [
        {
            id: "u16",
            project: "Johnson Residence",
            startDate: "2025-04-01",
            endDate: null,
            crew: "Finishing Crew",
            hoursUsed: 75,
            fuelConsumed: 225,
        },
        {
            id: "u17",
            project: "Riverside Apartments",
            startDate: "2025-02-15",
            endDate: "2025-03-20",
            crew: "Framing Crew",
            hoursUsed: 110,
            fuelConsumed: 330,
        },
    ],
    eq10: [
        {
            id: "u18",
            project: "Downtown Project",
            startDate: "2025-01-10",
            endDate: "2025-04-15",
            crew: "Electrical Team",
            hoursUsed: 180,
            fuelConsumed: 0,
        },
    ],
    eq11: [
        {
            id: "u19",
            project: "Main Street Development",
            startDate: "2025-03-01",
            endDate: "2025-03-15",
            crew: "Foundation Team",
            hoursUsed: 45,
            fuelConsumed: 90,
        },
    ],
    eq12: [
        {
            id: "u20",
            project: "Downtown Project",
            startDate: "2025-04-01",
            endDate: null,
            crew: "Electrical Team",
            hoursUsed: 85,
            fuelConsumed: 340,
        },
        {
            id: "u21",
            project: "Riverside Apartments",
            startDate: "2025-01-15",
            endDate: "2025-03-20",
            crew: "Framing Crew",
            hoursUsed: 210,
            fuelConsumed: 840,
        },
    ],
}

// Status options with colors and labels
const statusOptions = {
    "in-use": { label: "In Use", color: "badge-primary" },
    available: { label: "Available", color: "badge-success" },
    maintenance: { label: "Maintenance", color: "badge-warning" },
    repair: { label: "Under Repair", color: "badge-error" },
    retired: { label: "Retired", color: "badge-neutral" },
}

// Mock data for crews
const crewsData = [
    {
        id: "crew1",
        name: "Foundation Team",
    },
    {
        id: "crew2",
        name: "Framing Crew",
    },
    {
        id: "crew3",
        name: "Electrical Team",
    },
    {
        id: "crew4",
        name: "Plumbing Specialists",
    },
    {
        id: "crew5",
        name: "Finishing Crew",
    },
]

// Mock data for projects
const projectsData = [
    {
        id: "proj1",
        name: "Main Street Development",
    },
    {
        id: "proj2",
        name: "Riverside Apartments",
    },
    {
        id: "proj3",
        name: "Downtown Project",
    },
    {
        id: "proj4",
        name: "Johnson Residence",
    },
]

export default function EquipmentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const equipmentId = params.id as string
    const [activeTab, setActiveTab] = useState("details")
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
    const [assignment, setAssignment] = useState({
        crew: "",
        project: "",
        startDate: new Date().toISOString().split("T")[0],
        notes: "",
    })
    const [maintenanceRecord, setMaintenanceRecord] = useState({
        type: "Scheduled",
        description: "",
        technician: "",
        cost: 0,
        notes: "",
    })

    const equipment = equipmentData[equipmentId as keyof typeof equipmentData]
    const maintenance = maintenanceHistory[equipmentId as keyof typeof maintenanceHistory] || []
    const usage = usageHistory[equipmentId as keyof typeof usageHistory] || []

    // If equipment doesn't exist, redirect to equipment page
    useEffect(() => {
        if (!equipment) {
            router.push("/dashboard/equipment")
        }
    }, [equipment, router])

    if (!equipment) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        )
    }

    const handleAssignEquipment = () => {
        // In a real app, this would update the database
        // For now, we'll just close the modal
        setShowAssignModal(false)
    }

    const handleAddMaintenance = () => {
        // In a real app, this would update the database
        // For now, we'll just close the modal
        setShowMaintenanceModal(false)
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/equipment" className="btn btn-ghost btn-sm">
                            <i className="fas fa-arrow-left"></i>
                        </Link>
                        <h1 className="text-2xl font-bold">{equipment.name}</h1>
                        <div className={`badge ${statusOptions[equipment.status].color}`}>
                            {statusOptions[equipment.status].label}
                        </div>
                    </div>
                    <p className="text-base-content/70 mt-1">
                        {equipment.make} {equipment.model} ({equipment.year})
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-outline btn-sm">
                        <i className="fas fa-edit mr-2"></i> Edit
                    </button>
                    {equipment.status === "available" ? (
                        <button className="btn btn-primary btn-sm" onClick={() => setShowAssignModal(true)}>
                            <i className="fas fa-truck-loading mr-2"></i> Assign
                        </button>
                    ) : equipment.status === "in-use" ? (
                        <button className="btn btn-secondary btn-sm">
                            <i className="fas fa-undo mr-2"></i> Return
                        </button>
                    ) : (
                        <button className="btn btn-success btn-sm">
                            <i className="fas fa-check mr-2"></i> Mark as Available
                        </button>
                    )}
                    <button className="btn btn-warning btn-sm" onClick={() => setShowMaintenanceModal(true)}>
                        <i className="fas fa-tools mr-2"></i> Maintenance
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-1">
                    <div className="card bg-base-100 shadow-sm">
                        <figure className="px-4 pt-4">
                            <img
                                src={equipment.image || "/placeholder.svg"}
                                alt={equipment.name}
                                className="rounded-xl h-48 w-full object-cover"
                            />
                        </figure>
                        <div className="card-body">
                            <h3 className="text-lg font-semibold mb-2">Current Status</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-base-content/70">Status:</span>
                                    <span className={`badge ${statusOptions[equipment.status].color}`}>
                                        {statusOptions[equipment.status].label}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-base-content/70">Location:</span>
                                    <span>{equipment.location}</span>
                                </div>
                                {equipment.assignedTo && (
                                    <div className="flex justify-between">
                                        <span className="text-base-content/70">Assigned To:</span>
                                        <span>{equipment.assignedTo}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-base-content/70">Next Maintenance:</span>
                                    <span>{new Date(equipment.nextMaintenance).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="divider"></div>

                            <h3 className="text-lg font-semibold mb-2">Financial</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-base-content/70">Purchase Date:</span>
                                    <span>{new Date(equipment.purchaseDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-base-content/70">Purchase Price:</span>
                                    <span>${equipment.purchasePrice.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-base-content/70">Current Value:</span>
                                    <span>${equipment.currentValue.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-base-content/70">Depreciation:</span>
                                    <span>
                                        {Math.round(((equipment.purchasePrice - equipment.currentValue) / equipment.purchasePrice) * 100)}%
                                    </span>
                                </div>
                            </div>

                            <div className="divider"></div>

                            <h3 className="text-lg font-semibold mb-2">Documents</h3>
                            <div className="space-y-2">
                                {equipment.documents.map((doc, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <span className="flex items-center">
                                            <i className="fas fa-file-pdf text-error mr-2"></i>
                                            {doc.name}
                                        </span>
                                        <button className="btn btn-ghost btn-xs">
                                            <i className="fas fa-download"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="tabs tabs-boxed mb-6">
                        <a className={`tab ${activeTab === "details" ? "tab-active" : ""}`} onClick={() => setActiveTab("details")}>
                            Details
                        </a>
                        <a
                            className={`tab ${activeTab === "maintenance" ? "tab-active" : ""}`}
                            onClick={() => setActiveTab("maintenance")}
                        >
                            Maintenance History
                        </a>
                        <a className={`tab ${activeTab === "usage" ? "tab-active" : ""}`} onClick={() => setActiveTab("usage")}>
                            Usage History
                        </a>
                        <a className={`tab ${activeTab === "costs" ? "tab-active" : ""}`} onClick={() => setActiveTab("costs")}>
                            Cost Analysis
                        </a>
                    </div>

                    {activeTab === "details" && (
                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <h3 className="text-lg font-semibold mb-4">Equipment Details</h3>
                                <p className="mb-4">{equipment.description}</p>

                                <h4 className="font-semibold mt-4 mb-2">Specifications</h4>
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra">
                                        <tbody>
                                            {Object.entries(equipment.specifications).map(([key, value]) => (
                                                <tr key={key}>
                                                    <td className="font-medium">{key}</td>
                                                    <td>{value}</td>
                                                </tr>
                                            ))}
                                            <tr>
                                                <td className="font-medium">Serial Number</td>
                                                <td>{equipment.serialNumber}</td>
                                            </tr>
                                            <tr>
                                                <td className="font-medium">Year</td>
                                                <td>{equipment.year}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <h4 className="font-semibold mt-6 mb-2">QR Code</h4>
                                <div className="flex items-center gap-4">
                                    <div className="bg-base-200 p-4 rounded-lg">
                                        <img
                                            src="/placeholder.svg?height=100&width=100&query=qr+code"
                                            alt="Equipment QR Code"
                                            className="w-24 h-24"
                                        />
                                    </div>
                                    <div>
                                        <p>Scan this QR code to quickly access equipment details in the field.</p>
                                        <button className="btn btn-sm btn-outline mt-2">
                                            <i className="fas fa-print mr-2"></i> Print QR Code
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "maintenance" && (
                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Maintenance History</h3>
                                    <button className="btn btn-sm btn-outline" onClick={() => setShowMaintenanceModal(true)}>
                                        <i className="fas fa-plus mr-2"></i> Add Record
                                    </button>
                                </div>

                                {maintenance.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="table table-zebra">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Type</th>
                                                    <th>Description</th>
                                                    <th>Technician</th>
                                                    <th>Cost</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {maintenance.map((record) => (
                                                    <tr key={record.id}>
                                                        <td>{new Date(record.date).toLocaleDateString()}</td>
                                                        <td>
                                                            <span
                                                                className={`badge ${record.type === "Scheduled" ? "badge-success" : "badge-warning"
                                                                    } badge-sm`}
                                                            >
                                                                {record.type}
                                                            </span>
                                                        </td>
                                                        <td>{record.description}</td>
                                                        <td>{record.technician}</td>
                                                        <td>${record.cost.toLocaleString()}</td>
                                                        <td>
                                                            <div className="flex gap-2">
                                                                <button className="btn btn-ghost btn-xs">
                                                                    <i className="fas fa-edit"></i>
                                                                </button>
                                                                <button className="btn btn-ghost btn-xs">
                                                                    <i className="fas fa-eye"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <i className="fas fa-tools text-4xl text-base-content/30 mb-4"></i>
                                        <h3 className="text-xl font-semibold mb-2">No maintenance records</h3>
                                        <p className="text-base-content/70">Add maintenance records to track service history</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "usage" && (
                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <h3 className="text-lg font-semibold mb-4">Usage History</h3>

                                {usage.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="table table-zebra">
                                            <thead>
                                                <tr>
                                                    <th>Project</th>
                                                    <th>Start Date</th>
                                                    <th>End Date</th>
                                                    <th>Crew</th>
                                                    <th>Hours Used</th>
                                                    <th>Fuel Used</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {usage.map((record) => (
                                                    <tr key={record.id}>
                                                        <td>{record.project}</td>
                                                        <td>{new Date(record.startDate).toLocaleDateString()}</td>
                                                        <td>
                                                            {record.endDate ? new Date(record.endDate).toLocaleDateString() : "Currently Assigned"}
                                                        </td>
                                                        <td>{record.crew}</td>
                                                        <td>{record.hoursUsed} hrs</td>
                                                        <td>{record.fuelConsumed} gal</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <i className="fas fa-chart-line text-4xl text-base-content/30 mb-4"></i>
                                        <h3 className="text-xl font-semibold mb-2">No usage records</h3>
                                        <p className="text-base-content/70">Usage records will appear when equipment is assigned</p>
                                    </div>
                                )}

                                <div className="mt-6">
                                    <h4 className="font-semibold mb-4">Usage Statistics</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="stat bg-base-200 rounded-lg">
                                            <div className="stat-title">Total Hours</div>
                                            <div className="stat-value">
                                                {usage.reduce((total, record) => total + record.hoursUsed, 0).toLocaleString()}
                                            </div>
                                            <div className="stat-desc">Lifetime usage</div>
                                        </div>
                                        <div className="stat bg-base-200 rounded-lg">
                                            <div className="stat-title">Total Fuel</div>
                                            <div className="stat-value">
                                                {usage.reduce((total, record) => total + record.fuelConsumed, 0).toLocaleString()} gal
                                            </div>
                                            <div className="stat-desc">Lifetime consumption</div>
                                        </div>
                                        <div className="stat bg-base-200 rounded-lg">
                                            <div className="stat-title">Projects</div>
                                            <div className="stat-value">
                                                {new Set(usage.map((record) => record.project)).size.toLocaleString()}
                                            </div>
                                            <div className="stat-desc">Used on</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "costs" && (
                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <h3 className="text-lg font-semibold mb-4">Cost Analysis</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold mb-2">Acquisition Costs</h4>
                                        <table className="table">
                                            <tbody>
                                                <tr>
                                                    <td>Purchase Price</td>
                                                    <td className="text-right">${equipment.purchasePrice.toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <td>Current Value</td>
                                                    <td className="text-right">${equipment.currentValue.toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <td>Depreciation</td>
                                                    <td className="text-right">
                                                        ${(equipment.purchasePrice - equipment.currentValue).toLocaleString()}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2">Maintenance Costs</h4>
                                        <table className="table">
                                            <tbody>
                                                <tr>
                                                    <td>Total Maintenance Cost</td>
                                                    <td className="text-right">
                                                        ${maintenance.reduce((total, record) => total + record.cost, 0).toLocaleString()}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Scheduled Maintenance</td>
                                                    <td className="text-right">
                                                        $
                                                        {maintenance
                                                            .filter((record) => record.type === "Scheduled")
                                                            .reduce((total, record) => total + record.cost, 0)
                                                            .toLocaleString()}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Repairs</td>
                                                    <td className="text-right">
                                                        $
                                                        {maintenance
                                                            .filter((record) => record.type === "Repair")
                                                            .reduce((total, record) => total + record.cost, 0)
                                                            .toLocaleString()}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <h4 className="font-semibold mb-2">Operating Costs</h4>
                                    <table className="table">
                                        <tbody>
                                            <tr>
                                                <td>Total Hours</td>
                                                <td className="text-right">
                                                    {usage.reduce((total, record) => total + record.hoursUsed, 0).toLocaleString()} hrs
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Total Fuel Consumed</td>
                                                <td className="text-right">
                                                    {usage.reduce((total, record) => total + record.fuelConsumed, 0).toLocaleString()} gal
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Estimated Fuel Cost (at $4.50/gal)</td>
                                                <td className="text-right">
                                                    ${(usage.reduce((total, record) => total + record.fuelConsumed, 0) * 4.5).toLocaleString()}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Cost per Hour (incl. maintenance)</td>
                                                <td className="text-right">
                                                    $
                                                    {usage.reduce((total, record) => total + record.hoursUsed, 0) > 0
                                                        ? (
                                                            (maintenance.reduce((total, record) => total + record.cost, 0) +
                                                                usage.reduce((total, record) => total + record.fuelConsumed, 0) * 4.5) /
                                                            usage.reduce((total, record) => total + record.hoursUsed, 0)
                                                        ).toFixed(2)
                                                        : "N/A"}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Assign Equipment Modal */}
            {showAssignModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Assign Equipment</h3>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Assign to Crew</span>
                            </label>
                            <select
                                className="select select-bordered"
                                value={assignment.crew}
                                onChange={(e) => setAssignment({ ...assignment, crew: e.target.value })}
                            >
                                <option value="" disabled>
                                    Select a crew
                                </option>
                                {crewsData.map((crew) => (
                                    <option key={crew.id} value={crew.name}>
                                        {crew.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Project</span>
                            </label>
                            <select
                                className="select select-bordered"
                                value={assignment.project}
                                onChange={(e) => setAssignment({ ...assignment, project: e.target.value })}
                            >
                                <option value="" disabled>
                                    Select a project
                                </option>
                                {projectsData.map((project) => (
                                    <option key={project.id} value={project.name}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Start Date</span>
                            </label>
                            <input
                                type="date"
                                className="input input-bordered"
                                value={assignment.startDate}
                                onChange={(e) => setAssignment({ ...assignment, startDate: e.target.value })}
                            />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Notes</span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered"
                                placeholder="Enter any special instructions or notes"
                                value={assignment.notes}
                                onChange={(e) => setAssignment({ ...assignment, notes: e.target.value })}
                            ></textarea>
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setShowAssignModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleAssignEquipment}>
                                Assign Equipment
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowAssignModal(false)}></div>
                </div>
            )}

            {/* Add Maintenance Record Modal */}
            {showMaintenanceModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Add Maintenance Record</h3>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Maintenance Type</span>
                            </label>
                            <select
                                className="select select-bordered"
                                value={maintenanceRecord.type}
                                onChange={(e) => setMaintenanceRecord({ ...maintenanceRecord, type: e.target.value })}
                            >
                                <option>Scheduled</option>
                                <option>Repair</option>
                            </select>
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Description</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter maintenance description"
                                className="input input-bordered"
                                value={maintenanceRecord.description}
                                onChange={(e) => setMaintenanceRecord({ ...maintenanceRecord, description: e.target.value })}
                            />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Technician</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter technician name"
                                className="input input-bordered"
                                value={maintenanceRecord.technician}
                                onChange={(e) => setMaintenanceRecord({ ...maintenanceRecord, technician: e.target.value })}
                            />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Cost</span>
                            </label>
                            <input
                                type="number"
                                placeholder="Enter cost"
                                className="input input-bordered"
                                value={maintenanceRecord.cost}
                                onChange={(e) => setMaintenanceRecord({ ...maintenanceRecord, cost: Number(e.target.value) })}
                            />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Notes</span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered"
                                placeholder="Enter any additional notes"
                                value={maintenanceRecord.notes}
                                onChange={(e) => setMaintenanceRecord({ ...maintenanceRecord, notes: e.target.value })}
                            ></textarea>
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setShowMaintenanceModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleAddMaintenance}>
                                Add Record
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowMaintenanceModal(false)}></div>
                </div>
            )}
        </div>
    )
}
