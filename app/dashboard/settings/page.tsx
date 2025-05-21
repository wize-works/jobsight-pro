"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Settings sections
const settingsSections = [
  {
    id: "account",
    name: "Account Settings",
    description: "Manage your personal account settings and preferences",
    icon: "user-cog",
  },
  {
    id: "organization",
    name: "Organization",
    description: "Manage your organization details, branding, and locations",
    icon: "building",
  },
  {
    id: "team",
    name: "Team Members",
    description: "Manage team members, roles, and permissions",
    icon: "users-cog",
  },
  {
    id: "notifications",
    name: "Notifications",
    description: "Configure your notification preferences and alerts",
    icon: "bell",
  },
  {
    id: "billing",
    name: "Billing & Subscription",
    description: "Manage your subscription plan, payment methods, and billing history",
    icon: "credit-card",
  },
  {
    id: "integrations",
    name: "Integrations",
    description: "Connect with third-party services and applications",
    icon: "plug",
  },
  {
    id: "security",
    name: "Security",
    description: "Manage security settings, two-factor authentication, and login history",
    icon: "shield-alt",
  },
  {
    id: "customization",
    name: "Customization",
    description: "Customize the appearance and behavior of your JobSight Pro instance",
    icon: "paint-brush",
  },
  {
    id: "data",
    name: "Data Management",
    description: "Manage your data, exports, imports, and backups",
    icon: "database",
  },
  {
    id: "api",
    name: "API & Webhooks",
    description: "Manage API keys, webhooks, and developer settings",
    icon: "code",
  },
]

export default function SettingsPage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("account")

  // Handle section click
  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId)
    router.push(`/dashboard/settings/${sectionId}`)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsSections.map((section) => (
          <div
            key={section.id}
            className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleSectionClick(section.id)}
          >
            <div className="card-body">
              <div className="flex items-center gap-3">
                <div className="bg-primary bg-opacity-20 p-3 rounded-full">
                  <i className={`fas fa-${section.icon} text-primary`}></i>
                </div>
                <h2 className="card-title">{section.name}</h2>
              </div>
              <p className="text-sm text-base-content/70 mt-2">{section.description}</p>
              <div className="card-actions justify-end mt-4">
                <Link href={`/dashboard/settings/${section.id}`} className="btn btn-sm btn-outline">
                  Manage <i className="fas fa-chevron-right ml-2"></i>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
