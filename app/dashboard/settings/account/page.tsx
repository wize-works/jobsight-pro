"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

export default function AccountSettingsPage() {
  const [user, setUser] = useState({
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    phone: "(555) 123-4567",
    jobTitle: "Project Manager",
    timezone: "America/New_York",
    language: "en-US",
    avatar: "/placeholder.svg?key=eloc4",
  })

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ ...user })

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setUser({ ...formData })
    setIsEditing(false)
    // In a real app, this would save to the backend
  }

  // Available timezones (simplified list)
  const timezones = [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "America/Anchorage", label: "Alaska Time (AKT)" },
    { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
    { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
    { value: "Europe/Paris", label: "Central European Time (CET)" },
    { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
    { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
  ]

  // Available languages
  const languages = [
    { value: "en-US", label: "English (United States)" },
    { value: "en-GB", label: "English (United Kingdom)" },
    { value: "es-ES", label: "Spanish (Spain)" },
    { value: "fr-FR", label: "French (France)" },
    { value: "de-DE", label: "German (Germany)" },
    { value: "it-IT", label: "Italian (Italy)" },
    { value: "pt-BR", label: "Portuguese (Brazil)" },
    { value: "ja-JP", label: "Japanese (Japan)" },
    { value: "zh-CN", label: "Chinese (Simplified)" },
    { value: "ru-RU", label: "Russian (Russia)" },
  ]

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/settings" className="btn btn-ghost btn-sm">
            <i className="fas fa-arrow-left"></i>
          </Link>
          <h1 className="text-2xl font-bold">Account Settings</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar - Navigation */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-sm mb-6">
            <div className="card-body">
              <h2 className="card-title">Settings</h2>
              <div className="divider mt-0"></div>
              <ul className="menu bg-base-100 w-full p-0">
                <li>
                  <a className="active">
                    <i className="fas fa-user"></i> Profile Information
                  </a>
                </li>
                <li>
                  <a>
                    <i className="fas fa-lock"></i> Password & Security
                  </a>
                </li>
                <li>
                  <a>
                    <i className="fas fa-bell"></i> Notification Preferences
                  </a>
                </li>
                <li>
                  <a>
                    <i className="fas fa-globe"></i> Language & Region
                  </a>
                </li>
                <li>
                  <a>
                    <i className="fas fa-desktop"></i> Appearance
                  </a>
                </li>
                <li>
                  <a>
                    <i className="fas fa-mobile-alt"></i> Connected Devices
                  </a>
                </li>
                <li>
                  <a>
                    <i className="fas fa-history"></i> Account Activity
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-error">Danger Zone</h2>
              <div className="divider mt-0"></div>
              <p className="text-sm text-base-content/70 mb-4">
                These actions are irreversible. Please proceed with caution.
              </p>
              <button className="btn btn-outline btn-error btn-block">
                <i className="fas fa-trash mr-2"></i> Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Right content - Profile information */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-sm mb-6">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <h2 className="card-title">Profile Information</h2>
                {!isEditing && (
                  <button className="btn btn-sm btn-outline" onClick={() => setIsEditing(true)}>
                    <i className="fas fa-edit mr-2"></i> Edit
                  </button>
                )}
              </div>
              <div className="divider mt-0"></div>

              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col md:flex-row gap-6 mb-6">
                    <div className="flex flex-col items-center">
                      <div className="avatar">
                        <div className="w-24 rounded-full">
                          <Image src={user.avatar || "/placeholder.svg"} alt="Profile" width={96} height={96} />
                        </div>
                      </div>
                      <button type="button" className="btn btn-sm btn-outline mt-4">
                        <i className="fas fa-upload mr-2"></i> Change Photo
                      </button>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Full Name</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          className="input input-bordered"
                          value={formData.name}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Email Address</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          className="input input-bordered"
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Phone Number</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          className="input input-bordered"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Job Title</span>
                        </label>
                        <input
                          type="text"
                          name="jobTitle"
                          className="input input-bordered"
                          value={formData.jobTitle}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>

                  <h3 className="font-semibold text-lg mt-6 mb-4">Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Timezone</span>
                      </label>
                      <select
                        name="timezone"
                        className="select select-bordered w-full"
                        value={formData.timezone}
                        onChange={handleChange}
                      >
                        {timezones.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Language</span>
                      </label>
                      <select
                        name="language"
                        className="select select-bordered w-full"
                        value={formData.language}
                        onChange={handleChange}
                      >
                        {languages.map((lang) => (
                          <option key={lang.value} value={lang.value}>
                            {lang.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex flex-col md:flex-row gap-6 mb-6">
                    <div className="flex flex-col items-center">
                      <div className="avatar">
                        <div className="w-24 rounded-full">
                          <Image src={user.avatar || "/placeholder.svg"} alt="Profile" width={96} height={96} />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
                        <div>
                          <div className="text-sm text-base-content/70">Full Name</div>
                          <div className="font-medium">{user.name}</div>
                        </div>
                        <div>
                          <div className="text-sm text-base-content/70">Email Address</div>
                          <div className="font-medium">{user.email}</div>
                        </div>
                        <div>
                          <div className="text-sm text-base-content/70">Phone Number</div>
                          <div className="font-medium">{user.phone}</div>
                        </div>
                        <div>
                          <div className="text-sm text-base-content/70">Job Title</div>
                          <div className="font-medium">{user.jobTitle}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="font-semibold text-lg mt-6 mb-4">Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
                    <div>
                      <div className="text-sm text-base-content/70">Timezone</div>
                      <div className="font-medium">
                        {timezones.find((tz) => tz.value === user.timezone)?.label || user.timezone}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-base-content/70">Language</div>
                      <div className="font-medium">
                        {languages.find((lang) => lang.value === user.language)?.label || user.language}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Connected Accounts</h2>
              <div className="divider mt-0"></div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#1877F2] bg-opacity-20 p-3 rounded-full">
                      <i className="fab fa-google text-[#DB4437]"></i>
                    </div>
                    <div>
                      <div className="font-medium">Google</div>
                      <div className="text-sm text-base-content/70">Not connected</div>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-outline">Connect</button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#1877F2] bg-opacity-20 p-3 rounded-full">
                      <i className="fab fa-microsoft text-[#00A4EF]"></i>
                    </div>
                    <div>
                      <div className="font-medium">Microsoft</div>
                      <div className="text-sm text-base-content/70">Connected as alex.johnson@outlook.com</div>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-outline btn-error">Disconnect</button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#1877F2] bg-opacity-20 p-3 rounded-full">
                      <i className="fab fa-slack text-[#4A154B]"></i>
                    </div>
                    <div>
                      <div className="font-medium">Slack</div>
                      <div className="text-sm text-base-content/70">Not connected</div>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-outline">Connect</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
