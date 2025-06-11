"use client";

import { useState, useEffect } from "react";
import { useBusiness } from "@/lib/business-context";
import { updateBusinessFromForm } from "@/app/actions/business";
import { getUsers, deleteUser } from "@/app/actions/users";
import { toast } from "@/hooks/use-toast";
import { getProjects } from "@/app/actions/projects";
import { getEquipments } from "@/app/actions/equipments";
import UsersPermissionsTab from "./components/tab-users";
import { TabSubscription } from "./components/tab-subscription";
import { getCurrentSubscription } from "@/app/actions/subscriptions";
import { BusinessSubscription } from "@/types/subscription";


export default function BusinessPage() {
    const [activeTab, setActiveTab] = useState("profile");
    const { business, loading, error, refreshBusiness } = useBusiness();
    const [subscription, setSubscription] = useState<BusinessSubscription | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userCount, setUserCount] = useState(0);
    const [projectCount, setProjectCount] = useState(0);
    const [equipmentCount, setEquipmentCount] = useState(0);
    const [dataLoaded, setDataLoaded] = useState(false);


    useEffect(() => {
        if (business && !dataLoaded && !loading) {
            async function fetchData() {
                try {
                    const [users, projects, equipment, businessSubscription] = await Promise.all([
                        getUsers(),
                        getProjects(),
                        getEquipments(),
                        getCurrentSubscription()
                    ]);
                    setUserCount(users.length);
                    setProjectCount(projects.length);
                    setEquipmentCount(equipment.length);
                    setSubscription(businessSubscription);
                    setDataLoaded(true);
                } catch (error) {
                    console.error("Error fetching users:", error);
                }
            }
            fetchData();
        }

        if (!business) {
            refreshBusiness();
        }
    }, [business, loading, dataLoaded]);

    useEffect(() => {
        if (business && !dataLoaded) {
            refreshBusiness();
        }
    }, [business, loading]);

    const handleSaveChanges = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            if (business?.id) {
                formData.append("id", business.id);
            }

            const result = await updateBusinessFromForm(formData);

            if (result.success) {
                await refreshBusiness();
                toast.success("Business information updated successfully");
            } else {
                toast.error("Failed to update business information");
            }
        } catch (error) {
            console.error("Error updating business:", error);
            toast.error("An error occurred while updating business information");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>
    }

    if (error) {
        return <div className="alert alert-error">Error loading business information: {error}</div>
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Business Management</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="stat bg-base-100 shadow">
                    <div className="stat-title text-lg">Total Equipments</div>
                    <div className="flex items-center justify-between">
                        <div className="stat-value text-primary">{equipmentCount}</div>
                        <div className="stat-icon text-primary bg-primary/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="fas fa-tools fa-lg"></i>
                        </div>
                    </div>
                    <div className="stat-desc">All equipment items</div>
                </div>
                <div className="stat bg-base-100 shadow">
                    <div className="stat-title text-lg">Total Projects</div>
                    <div className="flex items-center justify-between">
                        <div className="stat-value text-accent">{projectCount}</div>
                        <div className="stat-icon text-accent bg-accent/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="fas fa-briefcase fa-lg"></i>
                        </div>
                    </div>
                    <div className="stat-desc">All active projects</div>
                </div>
                <div className="stat bg-base-100 shadow">
                    <div className="stat-title text-lg">Total Users</div>
                    <div className="flex items-center justify-between">
                        <div className="stat-value text-secondary">{userCount}</div>
                        <div className="stat-icon text-secondary bg-secondary/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="fas fa-users fa-lg"></i>
                        </div>
                    </div>
                    <div className="stat-desc">All team members</div>
                </div>
                <div className="stat bg-base-100 shadow">
                    <div className="stat-title text-lg">Subscription</div>
                    <div className="flex items-center justify-between">
                        <div className="stat-value text-info">{subscription?.plan_id}</div>
                        <div className="stat-icon text-info bg-info/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="fas fa-credit-card fa-lg"></i>
                        </div>
                    </div>
                    <div className="stat-desc">Current plan: Free</div>
                </div>
            </div>

            <div className="tabs tabs-box mb-6">
                <a className={`tab ${activeTab === "profile" ? "tab-active" : ""}`} onClick={() => setActiveTab("profile")}>
                    Business Profile
                </a>
                <a className={`tab ${activeTab === "users" ? "tab-active" : ""}`} onClick={() => setActiveTab("users")}>
                    Users & Permissions
                </a>
                <a
                    className={`tab ${activeTab === "subscription" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("subscription")}
                >
                    Subscription
                </a>
            </div>

            {activeTab === "profile" && (
                <form action={handleSaveChanges}>
                    <div className="grid grid-cols-2 gap-6 mb-4">
                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="card-title text-xl">Business Information</h2>
                                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                        <i className="fas fa-save mr-2"></i> {isSubmitting ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Business Name</span>
                                        </label>
                                        <input type="text" name="name" className="input input-bordered w-full" defaultValue={business?.name || ""} />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Business Type</span>
                                        </label>
                                        <select
                                            className="select select-bordered w-full"
                                            name="business_type"
                                            defaultValue={business?.business_type || ""}
                                        >
                                            <option value="General Contractor">General Contractor</option>
                                            <option value="Specialty Contractor">Specialty Contractor</option>
                                            <option value="Home Builder">Home Builder</option>
                                            <option value="Remodeler">Remodeler</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Phone Number</span>
                                        </label>
                                        <input type="tel" name="phone" className="input input-bordered w-full" defaultValue={business?.phone || ""} />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Email</span>
                                        </label>
                                        <input type="email" name="email" className="input input-bordered w-full" defaultValue={business?.email || ""} />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Website</span>
                                        </label>
                                        <input type="url" name="website" className="input input-bordered w-full" defaultValue={business?.website || ""} />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Logo Url</span>
                                        </label>
                                        <input type="url" name="logo_url" className="input input-bordered w-full" defaultValue={business?.logo_url || ""} />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Tax ID / EIN</span>
                                        </label>
                                        <input type="text" name="tax_id" className="input input-bordered w-full" defaultValue={business?.tax_id || ""} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <h2 className="card-title text-xl mb-4">Business Address</h2>
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                                    <div className="form-control md:col-span-6">
                                        <label className="label">
                                            <span className="label-text">Street Address</span>
                                        </label>
                                        <input type="text" name="address" className="input input-bordered w-full" defaultValue={business?.address || ""} />
                                    </div>

                                    <div className="form-control md:col-span-3">
                                        <label className="label">
                                            <span className="label-text">City</span>
                                        </label>
                                        <input type="text" name="city" className="input input-bordered w-full" defaultValue={business?.city || ""} />
                                    </div>                                    <div className="form-control md:col-span-1">
                                        <label className="label">
                                            <span className="label-text">State</span>
                                        </label>
                                        <select
                                            className="select select-bordered w-full"
                                            name="state"
                                            key={business?.state || "empty"}
                                            defaultValue={business?.state || ""}
                                        >
                                            <option value="">Select State</option>
                                            <option value="AL">AL - Alabama</option>
                                            <option value="AK">AK - Alaska</option>
                                            <option value="AZ">AZ - Arizona</option>
                                            <option value="AR">AR - Arkansas</option>
                                            <option value="CA">CA - California</option>
                                            <option value="CO">CO - Colorado</option>
                                            <option value="CT">CT - Connecticut</option>
                                            <option value="DE">DE - Delaware</option>
                                            <option value="FL">FL - Florida</option>
                                            <option value="GA">GA - Georgia</option>
                                            <option value="HI">HI - Hawaii</option>
                                            <option value="ID">ID - Idaho</option>
                                            <option value="IL">IL - Illinois</option>
                                            <option value="IN">IN - Indiana</option>
                                            <option value="IA">IA - Iowa</option>
                                            <option value="KS">KS - Kansas</option>
                                            <option value="KY">KY - Kentucky</option>
                                            <option value="LA">LA - Louisiana</option>
                                            <option value="ME">ME - Maine</option>
                                            <option value="MD">MD - Maryland</option>
                                            <option value="MA">MA - Massachusetts</option>
                                            <option value="MI">MI - Michigan</option>
                                            <option value="MN">MN - Minnesota</option>
                                            <option value="MS">MS - Mississippi</option>
                                            <option value="MO">MO - Missouri</option>
                                            <option value="MT">MT - Montana</option>
                                            <option value="NE">NE - Nebraska</option>
                                            <option value="NV">NV - Nevada</option>
                                            <option value="NH">NH - New Hampshire</option>
                                            <option value="NJ">NJ - New Jersey</option>
                                            <option value="NM">NM - New Mexico</option>
                                            <option value="NY">NY - New York</option>
                                            <option value="NC">NC - North Carolina</option>
                                            <option value="ND">ND - North Dakota</option>
                                            <option value="OH">OH - Ohio</option>
                                            <option value="OK">OK - Oklahoma</option>
                                            <option value="OR">OR - Oregon</option>
                                            <option value="PA">PA - Pennsylvania</option>
                                            <option value="RI">RI - Rhode Island</option>
                                            <option value="SC">SC - South Carolina</option>
                                            <option value="SD">SD - South Dakota</option>
                                            <option value="TN">TN - Tennessee</option>
                                            <option value="TX">TX - Texas</option>
                                            <option value="UT">UT - Utah</option>
                                            <option value="VT">VT - Vermont</option>
                                            <option value="VA">VA - Virginia</option>
                                            <option value="WA">WA - Washington</option>
                                            <option value="WV">WV - West Virginia</option>
                                            <option value="WI">WI - Wisconsin</option>
                                            <option value="WY">WY - Wyoming</option>
                                        </select>
                                    </div>

                                    <div className="form-control md:col-span-2">
                                        <label className="label">
                                            <span className="label-text">Zip Code</span>
                                        </label>
                                        <input type="text" name="zip" className="input input-bordered w-full" defaultValue={business?.zip || ""} />
                                    </div>

                                    <div className="form-control col-span-3">
                                        <label className="label">
                                            <span className="label-text">Country</span>
                                        </label>
                                        <select className="select select-bordered w-full" name="country" defaultValue={business?.country || ""} >
                                            <option value="United States">United States</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            )}

            {activeTab === "users" && <UsersPermissionsTab />}

            {activeTab === "subscription" && <TabSubscription />}
        </div>
    )
}