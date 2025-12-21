"use client";

import React, { useState } from 'react';
import { useAppContext } from '@/components/layout/AppProvider';
import { AdminSidebar } from './AdminSidebar';
import AdminUserManagement from './AdminUserManagement';
import AdminCriteriaManagement from './AdminCriteriaManagement';
import AdminOrgView from './AdminOrgView';
import AdminSystemConfig from './AdminSystemConfig';
import BaseScoreAdjustment from './BaseScoreAdjustment';
import ScoreAdjustmentTool from './ScoreAdjustmentTool';
import PermissionsManagement from './PermissionsManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction } from 'lucide-react';

const AdminDashboard = () => {
    const { goBack, user } = useAppContext();
    const [activeTab, setActiveTab] = useState(user?.isAdmin ? 'users' : 'adjustments');

    const renderContent = () => {
        switch (activeTab) {
            case 'users': return user?.isAdmin ? <AdminUserManagement /> : null;
            case 'criteria': return (user?.isAdmin || user?.canViewReport) ? <AdminCriteriaManagement /> : null;
            case 'org': return <AdminOrgView />;
            case 'adjustments': return <BaseScoreAdjustment />;
            case 'ai-tool': return <ScoreAdjustmentTool />;
            case 'system': return user?.isAdmin ? <AdminSystemConfig /> : null;
            case 'permissions': return user?.isAdmin ? <PermissionsManagement /> : null;
            default:
                return user?.isAdmin ? <AdminSystemConfig /> : <BaseScoreAdjustment />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex flex-col md:flex-row animate-fade-in font-sans">
            <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} onBack={goBack} user={user} />
            <main className="flex-1 p-4 md:p-6 overflow-y-auto max-h-screen">
                <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl shadow-indigo-100 border border-white h-full overflow-y-auto p-6 md:p-8 animate-in slide-in-from-right-4 duration-500">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
