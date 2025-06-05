import { DailyLogEquipment } from "@/types/daily-log-equipment";
import { DailyLogMaterial } from "@/types/daily-log-materials";
import { EquipmentCondition, equipmentConditionOptions, equipmentStatusOptions } from "@/types/equipment";
import { formatCurrency } from "@/utils/formatters";

export default function TabMaterials({ materials, equipment }: { materials: any[] | [], equipment: any[] | [] }) {
    const totalCost = materials.reduce((total, item) => total + (item.cost || 0), 0);
    const totalHours = equipment.reduce((total, item) => total + (item.hours || 0), 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* Materials Used */}
                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <h3 className="card-title">Materials Used</h3>
                        <div className="overflow-x-auto">
                            <table className="table table-zebra w-full">
                                <thead>
                                    <tr>
                                        <th>Material</th>
                                        <th>Quantity</th>
                                        <th>Supplier</th>
                                        <th>Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {materials && materials.length > 0 ? materials.map((material) => (
                                        <tr key={material.id}>
                                            <td>{material.name}</td>
                                            <td>{material.quantity}</td>
                                            <td>{material.supplier}</td>
                                            <td className="text-right">{formatCurrency(material.cost.toFixed(2))}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="text-center text-base-content/50">No materials used</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={3} className="text-left font-bold">Total Cost</td>
                                        <td className="font-bold text-right">
                                            {formatCurrency(Number(totalCost))}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Equipment Used */}
                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <h3 className="card-title">Equipment Used</h3>
                        <div className="overflow-x-auto">
                            <table className="table table-zebra w-full">
                                <thead>
                                    <tr>
                                        <th>Equipment</th>
                                        <th>Hours</th>
                                        <th>Operator</th>
                                        <th>Condition</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {equipment && equipment.length > 0 ? equipment.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.name}</td>
                                            <td>{item.hours}</td>
                                            <td>{item.operator}</td>
                                            <td>
                                                {equipmentConditionOptions.badge(item.condition as EquipmentCondition)}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="text-center text-base-content/50">No equipment used</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={1} className="text-left font-bold">Total Hours</td>
                                        <td colSpan={3} className="font-bold">
                                            {equipment.reduce((total, item) => total + (item.hours || 0), 0)} hrs
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Material Cost Breakdown */}
                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <h3 className="card-title">Material Cost Breakdown</h3>
                        <div className="space-y-3">
                            {materials && materials.length === 0 ? (
                                <div className="text-base-content/50 text-center">No material costs available</div>
                            ) : (
                                <div className="space-y-3">
                                    {materials.map((material) => (
                                        <div key={material.id}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm">{material.name}</span>
                                                <span className="text-sm">{formatCurrency(material.cost?.toFixed(2))}</span>
                                            </div>
                                            <progress className="progress progress-primary w-full" value={material.cost / totalCost * 100 || 0} max="100"></progress>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="divider"></div>
                            <div className="text-center bg-base-200 p-4 rounded-lg">
                                <div className="text-3xl font-bold text-primary">{formatCurrency(totalCost)}</div>
                                <div className="text-base-content/70">Total Material Cost</div>
                                <div className="text-xs text-base-content/50">For 2023-05-20</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Equipment Hours */}
                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <h3 className="card-title">Equipment Hours</h3>
                        <div className="space-y-3">
                            {equipment && equipment.length === 0 ? (
                                <div className="text-base-content/50 text-center">No equipment hours available</div>
                            ) : (
                                <div className="space-y-3">
                                    {equipment.map((item) => (
                                        <div key={item.id}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm">{item.name}</span>
                                                <span className="text-sm">{item.hours} hrs</span>
                                            </div>
                                            <progress className="progress progress-secondary w-full" value={item.hours / totalHours * 100 || 0} max="100"></progress>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="divider"></div>
                            <div className="text-center bg-base-200 p-4 rounded-lg">
                                <div className="text-3xl font-bold text-secondary">{totalHours}</div>
                                <div className="text-base-content/70">Total Equipment Hours</div>
                                <div className="text-xs text-base-content/50">For 2023-05-20</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}