import React from 'react';
import { Users, AlertTriangle, Package, Activity } from 'lucide-react';

const WidgetGrid = ({ systems = [] }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {systems.includes('HR') && (
                <Widget
                    title="Total Employees"
                    value="1,254"
                    change="+12%"
                    icon={Users}
                    color="bg-emerald-500/20 text-emerald-400"
                />
            )}
            {systems.includes('WHM') && (
                <Widget
                    title="Warehouse Stock"
                    value="8,421"
                    change="-2%"
                    icon={Package}
                    color="bg-blue-500/20 text-blue-400"
                />
            )}
            <Widget
                title="Security Alerts"
                value="0"
                change="Stable"
                icon={AlertTriangle}
                color="bg-orange-500/20 text-orange-400"
            />
            <Widget
                title="System Uptime"
                value="99.9%"
                change="Optimal"
                icon={Activity}
                color="bg-purple-500/20 text-purple-400"
            />
        </div>
    );
};

const Widget = ({ title, value, change, icon: Icon, color }) => (
    <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl hover:bg-white/10 transition-all hover:scale-[1.02] cursor-default">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className={`text-xs font-bold px-2 py-1 rounded-full ${change.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-400'}`}>
                {change}
            </div>
        </div>
        <div className="text-gray-400 text-sm font-medium mb-1">{title}</div>
        <div className="text-2xl font-bold text-white">{value}</div>
    </div>
);

export default WidgetGrid;
