
"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function CustomizationSettingsPage() {
    const [settings, setSettings] = useState({
        theme: "system",
        primaryColor: "blue",
        dashboardLayout: "default",
        compactMode: false,
        showAvatars: true,
        showProjectImages: true,
        defaultView: "kanban",
        itemsPerPage: 25,
        enableAnimations: true,
        enableSounds: false
    })

    const handleSave = () => {
        // In a real implementation, this would save to the database
        toast({ title: "Success", description: "Customization settings saved successfully" })
    }

    const themes = [
        { value: "light", label: "Light", preview: "bg-white text-black" },
        { value: "dark", label: "Dark", preview: "bg-gray-900 text-white" },
        { value: "system", label: "System", preview: "bg-gradient-to-r from-white to-gray-900" }
    ]

    const colors = [
        { value: "blue", label: "Blue", color: "bg-blue-500" },
        { value: "green", label: "Green", color: "bg-green-500" },
        { value: "purple", label: "Purple", color: "bg-purple-500" },
        { value: "orange", label: "Orange", color: "bg-orange-500" },
        { value: "red", label: "Red", color: "bg-red-500" },
        { value: "teal", label: "Teal", color: "bg-teal-500" }
    ]

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/settings" className="btn btn-ghost btn-sm">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                    <h1 className="text-2xl font-bold">Customization</h1>
                </div>
                <button className="btn btn-primary" onClick={handleSave}>
                    Save Changes
                </button>
            </div>

            <div className="space-y-6">
                {/* Appearance */}
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">Appearance</h2>
                        
                        <div className="space-y-6">
                            {/* Theme Selection */}
                            <div>
                                <label className="label">
                                    <span className="label-text font-medium">Theme</span>
                                </label>
                                <div className="grid grid-cols-3 gap-4">
                                    {themes.map((theme) => (
                                        <label key={theme.value} className="cursor-pointer">
                                            <input
                                                type="radio"
                                                name="theme"
                                                value={theme.value}
                                                checked={settings.theme === theme.value}
                                                onChange={(e) => setSettings({...settings, theme: e.target.value})}
                                                className="radio radio-primary sr-only"
                                            />
                                            <div className={`card border-2 ${settings.theme === theme.value ? 'border-primary' : 'border-base-300'}`}>
                                                <div className="card-body p-4 text-center">
                                                    <div className={`w-full h-8 rounded mb-2 ${theme.preview}`}></div>
                                                    <span className="text-sm font-medium">{theme.label}</span>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Primary Color */}
                            <div>
                                <label className="label">
                                    <span className="label-text font-medium">Primary Color</span>
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {colors.map((color) => (
                                        <label key={color.value} className="cursor-pointer">
                                            <input
                                                type="radio"
                                                name="primaryColor"
                                                value={color.value}
                                                checked={settings.primaryColor === color.value}
                                                onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                                                className="radio sr-only"
                                            />
                                            <div className={`w-12 h-12 rounded-full ${color.color} border-4 ${settings.primaryColor === color.value ? 'border-gray-800' : 'border-transparent'} flex items-center justify-center`}>
                                                {settings.primaryColor === color.value && (
                                                    <i className="fas fa-check text-white"></i>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Layout Options */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Dashboard Layout</span>
                                    </label>
                                    <select
                                        className="select select-bordered"
                                        value={settings.dashboardLayout}
                                        onChange={(e) => setSettings({...settings, dashboardLayout: e.target.value})}
                                    >
                                        <option value="default">Default</option>
                                        <option value="compact">Compact</option>
                                        <option value="spacious">Spacious</option>
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Default Project View</span>
                                    </label>
                                    <select
                                        className="select select-bordered"
                                        value={settings.defaultView}
                                        onChange={(e) => setSettings({...settings, defaultView: e.target.value})}
                                    >
                                        <option value="list">List View</option>
                                        <option value="kanban">Kanban Board</option>
                                        <option value="calendar">Calendar View</option>
                                        <option value="timeline">Timeline View</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Display Options */}
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">Display Options</h2>
                        
                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label cursor-pointer justify-start gap-4">
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary"
                                        checked={settings.compactMode}
                                        onChange={(e) => setSettings({...settings, compactMode: e.target.checked})}
                                    />
                                    <div>
                                        <span className="label-text font-medium block">Compact Mode</span>
                                        <span className="text-xs text-base-content/70">
                                            Reduce spacing and padding for more content on screen
                                        </span>
                                    </div>
                                </label>
                            </div>

                            <div className="form-control">
                                <label className="label cursor-pointer justify-start gap-4">
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary"
                                        checked={settings.showAvatars}
                                        onChange={(e) => setSettings({...settings, showAvatars: e.target.checked})}
                                    />
                                    <div>
                                        <span className="label-text font-medium block">Show User Avatars</span>
                                        <span className="text-xs text-base-content/70">
                                            Display profile pictures throughout the interface
                                        </span>
                                    </div>
                                </label>
                            </div>

                            <div className="form-control">
                                <label className="label cursor-pointer justify-start gap-4">
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary"
                                        checked={settings.showProjectImages}
                                        onChange={(e) => setSettings({...settings, showProjectImages: e.target.checked})}
                                    />
                                    <div>
                                        <span className="label-text font-medium block">Show Project Images</span>
                                        <span className="text-xs text-base-content/70">
                                            Display preview images for projects and tasks
                                        </span>
                                    </div>
                                </label>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Items Per Page</span>
                                </label>
                                <select
                                    className="select select-bordered max-w-xs"
                                    value={settings.itemsPerPage}
                                    onChange={(e) => setSettings({...settings, itemsPerPage: parseInt(e.target.value)})}
                                >
                                    <option value={10}>10 items</option>
                                    <option value={25}>25 items</option>
                                    <option value={50}>50 items</option>
                                    <option value={100}>100 items</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Interface Behavior */}
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">Interface Behavior</h2>
                        
                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label cursor-pointer justify-start gap-4">
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary"
                                        checked={settings.enableAnimations}
                                        onChange={(e) => setSettings({...settings, enableAnimations: e.target.checked})}
                                    />
                                    <div>
                                        <span className="label-text font-medium block">Enable Animations</span>
                                        <span className="text-xs text-base-content/70">
                                            Show smooth transitions and animations throughout the interface
                                        </span>
                                    </div>
                                </label>
                            </div>

                            <div className="form-control">
                                <label className="label cursor-pointer justify-start gap-4">
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary"
                                        checked={settings.enableSounds}
                                        onChange={(e) => setSettings({...settings, enableSounds: e.target.checked})}
                                    />
                                    <div>
                                        <span className="label-text font-medium block">Enable Sound Effects</span>
                                        <span className="text-xs text-base-content/70">
                                            Play sounds for notifications and actions
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
