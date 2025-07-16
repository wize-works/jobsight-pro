"use client";

// Disable static generation for authenticated pages
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useBusiness } from "@/lib/business-context";
import { useBusiness as useBusinessApi } from "@/hooks/useBusiness";
import { getUsers, deleteUser } from "@/app/actions/users";
import { toast } from "@/hooks/use-toast";
import { getProjects } from "@/app/actions/projects";
import { getEquipments } from "@/app/actions/equipments";
import { getInvoicesWithClient } from "@/app/actions/invoices";
import { getDailyLogs } from "@/app/actions/daily-logs";
import UsersPermissionsTab from "./components/tab-users";
import { TabSubscription } from "./components/tab-subscription";
import { getCurrentSubscription } from "@/app/actions/subscriptions";
import { BusinessSubscription } from "@/types/subscription";
import { SubscriptionAnalyticsDashboard, BrandingManager } from "@/components/subscription";
import { ReferralCodeGenerator } from "@/components/referral/ReferralCodeGenerator";
import { formatDate } from "@/utils/formatters";


export default function BusinessPage() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(tabParam || "profile");
    const { business, businessId, loading, error, refreshBusiness } = useBusiness();
    const { updateBusinessFromForm } = useBusinessApi();
    const [subscription, setSubscription] = useState<BusinessSubscription | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userCount, setUserCount] = useState(0);
    const [projectCount, setProjectCount] = useState(0);
    const [equipmentCount, setEquipmentCount] = useState(0);
    const [dataLoaded, setDataLoaded] = useState(false);
    // Initialize usage data with real values - will be updated when data loads
    const [usageData, setUsageData] = useState({
        userCount: 0,
        storageUsedMB: 0, // Will fetch real storage usage
        invoicesThisMonth: 0, // Will fetch real invoice count
        aiQueriesThisMonth: 0, // Will fetch real AI usage
        projectsActive: 0,
        dailyLogsThisMonth: 0 // Will fetch real daily logs count
    });

    // Handle tab parameter from URL
    useEffect(() => {
        if (tabParam && ['profile', 'users', 'subscription'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    useEffect(() => {
        if (businessId && !dataLoaded && !loading) {
            async function fetchData() {
                try {
                    const [users, projects, equipment, businessSubscription, invoices, dailyLogs] = await Promise.all([
                        getUsers(businessId),
                        getProjects(businessId),
                        getEquipments(businessId),
                        getCurrentSubscription(businessId),
                        getInvoicesWithClient(businessId),
                        getDailyLogs(businessId)
                    ]);

                    setUserCount(users.length);
                    setProjectCount(projects.length);
                    setEquipmentCount(equipment.length);
                    setSubscription(businessSubscription);

                    // Calculate current month data
                    const currentMonth = new Date().getMonth();
                    const currentYear = new Date().getFullYear();

                    const invoicesThisMonth = invoices.filter(invoice => {
                        const invoiceDate = new Date(invoice.created_at || '');
                        return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
                    }).length;

                    const dailyLogsThisMonth = dailyLogs.filter(log => {
                        const logDate = new Date(log.created_at || '');
                        return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
                    }).length;

                    // Update usage data with real counts
                    setUsageData({
                        userCount: users.length,
                        storageUsedMB: 0, // TODO: Calculate actual storage usage from media uploads
                        invoicesThisMonth: invoicesThisMonth,
                        aiQueriesThisMonth: 0, // TODO: Track AI query usage in database
                        projectsActive: projects.filter(p => p.status === 'active' || p.status === 'in-progress').length,
                        dailyLogsThisMonth: dailyLogsThisMonth
                    });

                    setDataLoaded(true);
                } catch (error) {
                    console.error("Error fetching analytics data:", error);
                }
            }
            fetchData();
        }

        if (!business) {
            refreshBusiness();
        }

        if (business && !dataLoaded) {
            refreshBusiness();
        }
    }, [businessId, business, loading, dataLoaded]);

    const handleSaveChanges = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            if (business?.id) {
                formData.append("id", business.id);
            }

            const result = await updateBusinessFromForm(formData);

            if (result) {
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
                            <i className="far fa-tools fa-lg"></i>
                        </div>
                    </div>
                    <div className="stat-desc">All equipment items</div>
                </div>
                <div className="stat bg-base-100 shadow">
                    <div className="stat-title text-lg">Total Projects</div>
                    <div className="flex items-center justify-between">
                        <div className="stat-value text-accent">{projectCount}</div>
                        <div className="stat-icon text-accent bg-accent/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="far fa-briefcase fa-lg"></i>
                        </div>
                    </div>
                    <div className="stat-desc">All active projects</div>
                </div>
                <div className="stat bg-base-100 shadow">
                    <div className="stat-title text-lg">Total Users</div>
                    <div className="flex items-center justify-between">
                        <div className="stat-value text-secondary">{userCount}</div>
                        <div className="stat-icon text-secondary bg-secondary/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="far fa-users fa-lg"></i>
                        </div>
                    </div>
                    <div className="stat-desc">All team members</div>
                </div>
                <div className="stat bg-base-100 shadow">
                    <div className="stat-title text-lg">Subscription</div>
                    <div className="flex items-center justify-between">
                        <div className="stat-value text-info">{subscription?.plan_id}</div>
                        <div className="stat-icon text-info bg-info/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="far fa-credit-card fa-lg"></i>
                        </div>
                    </div>
                    <div className="stat-desc">Subscription start date: {formatDate(subscription?.start_date || "")}</div>
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
                <a
                    className={`tab ${activeTab === "branding" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("branding")}
                >
                    Branding
                </a>
                <a
                    className={`tab ${activeTab === "analytics" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("analytics")}
                >
                    Analytics
                </a>
                <a
                    className={`tab ${activeTab === "referral" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("referral")}
                >
                    Referral Program
                </a>
            </div>{activeTab === "profile" && (
                <form action={handleSaveChanges}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                                    <h2 className="card-title text-xl">Business Information</h2>
                                    <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={isSubmitting}>
                                        <i className="far fa-save mr-2"></i> {isSubmitting ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title text-xl mb-4">Business Address</h2>
                                <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                                    <div className="form-control lg:col-span-6">
                                        <label className="label">
                                            <span className="label-text">Street Address</span>
                                        </label>
                                        <input type="text" name="address" className="input input-bordered w-full" defaultValue={business?.address || ""} />
                                    </div>

                                    <div className="form-control lg:col-span-3">
                                        <label className="label">
                                            <span className="label-text">City</span>
                                        </label>
                                        <input type="text" name="city" className="input input-bordered w-full" defaultValue={business?.city || ""} />
                                    </div>
                                    <div className="form-control lg:col-span-1">
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
                                    <div className="form-control lg:col-span-2">
                                        <label className="label">
                                            <span className="label-text">Zip Code</span>
                                        </label>
                                        <input type="text" name="zip" className="input input-bordered w-full" defaultValue={business?.zip || ""} />
                                    </div>

                                    <div className="form-control lg:col-span-3">
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
            )}            {activeTab === "users" && <UsersPermissionsTab />}

            {activeTab === "subscription" && <TabSubscription />}

            {activeTab === "branding" && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold">Custom Branding</h2>
                            <p className="text-base-content/70">Customize your company's brand appearance in JobSight Pro</p>
                        </div>
                    </div>
                    <BrandingManager businessId={businessId || ''} />
                </div>
            )}
            {activeTab === "analytics" && (
                <div className="space-y-6">
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title text-xl mb-4">
                                <i className="far fa-chart-bar mr-2"></i>
                                Subscription Analytics & Usage
                            </h2>
                            <p className="text-base-content/70 mb-4">
                                Monitor your plan usage and get insights to optimize your subscription.
                            </p>
                            <div className="alert alert-info mb-6">
                                <i className="far fa-info-circle"></i>
                                <div>
                                    <h3 className="font-bold">Data Status</h3>
                                    <div className="text-xs">
                                        ✅ <strong>Real Data:</strong> Users ({usageData.userCount}), Projects ({usageData.projectsActive}), Invoices ({usageData.invoicesThisMonth}), Daily Logs ({usageData.dailyLogsThisMonth})<br />
                                        ⏳ <strong>Coming Soon:</strong> Storage usage and AI query tracking will be implemented
                                    </div>
                                </div>
                            </div>
                            <SubscriptionAnalyticsDashboard usageData={usageData} />
                        </div>
                    </div>
                </div>
            )}
            {activeTab === "referral" && (
                <div className="space-y-6">
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title text-xl mb-4">
                                <i className="far fa-users mr-2"></i>
                                Referral Program
                            </h2>
                            <p className="text-base-content/70 mb-4">
                                Share your referral code with other businesses and earn sweepstake entries for each successful referral.
                            </p>
                            <div className="alert alert-info mb-6">
                                <i className="far fa-info-circle"></i>
                                <div>
                                    <h3 className="font-bold">How it works</h3>
                                    <div className="text-xs">
                                        • Share your unique referral code with other businesses<br />
                                        • When they sign up and subscribe to a paid plan, you both earn sweepstake entries<br />
                                        • The more referrals you make, the more entries you earn
                                    </div>
                                </div>
                            </div>
                            <ReferralCodeGenerator
                                businessId={businessId || ''}
                                onCodeGenerated={(code) => {
                                    toast.success("Referral code generated successfully!");
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}