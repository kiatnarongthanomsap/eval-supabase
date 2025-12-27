"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Database, FileText, Gavel, Layers, Settings, SlidersHorizontal, Users, Zap } from "lucide-react";
import { User } from "@/lib/types";

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onBack: () => void;
  user: User | null;
}

const navItems = [
  { id: 'system', label: 'ตั้งค่าระบบ', icon: Settings, adminOnly: true },
  { id: 'users', label: 'จัดการผู้ใช้', icon: Users, adminOnly: true },
  { id: 'criteria', label: 'หลักเกณฑ์', icon: FileText, adminOnly: true, allowReportViewer: true },
  { id: 'org', label: 'โครงสร้างองค์กร', icon: Layers, adminOnly: false },
  { id: 'adjustments', label: 'ปรับฐานคะแนน', icon: SlidersHorizontal, adminOnly: false },
  // { id: 'ai-tool', label: 'ข้อเสนอแนะ AI', icon: Zap, adminOnly: false },
  { id: 'permissions', label: 'จัดการสิทธิ์', icon: Gavel, adminOnly: true },
];

export function AdminSidebar({ activeTab, setActiveTab, onBack, user }: AdminSidebarProps) {
  const filteredItems = navItems.filter(item => {
    if (user?.isAdmin) return true;
    if (item.allowReportViewer && user?.canViewReport) return true;
    return !item.adminOnly;
  });

  return (
    <aside className="w-full md:w-72 bg-slate-900/95 backdrop-blur-md text-slate-200 flex-shrink-0 flex flex-col h-auto md:h-screen sticky top-0 z-30 border-r border-slate-800 shadow-2xl">
      <div className="p-6 border-b border-slate-800/50 bg-slate-950/20">
        <h2 className="font-bold font-heading text-xl text-white tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Settings className="w-5 h-5 text-white" />
          </div>
          {user?.isAdmin ? 'Admin Console' : 'Manager Tools'}
        </h2>
        <p className="text-xs text-slate-500 mt-2 font-medium tracking-wide uppercase pl-1">Performance Eval System</p>
      </div>
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {filteredItems.map(item => (
          <Button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-11 rounded-xl transition-all duration-200",
              activeTab === item.id
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-900/20 font-semibold translate-x-1'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white hover:translate-x-1'
            )}
          >
            <item.icon className={cn("h-5 w-5 transition-colors", activeTab === item.id ? "text-indigo-100" : "text-slate-500 group-hover:text-slate-300")} />
            {item.label}
          </Button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800/50 bg-slate-950/20">
        <Button onClick={onBack} variant="ghost" className="w-full justify-start gap-3 text-slate-400 hover:bg-slate-800 hover:text-white h-12 rounded-xl">
          <ArrowLeft className="h-5 w-5" /> ย้อนกลับ
        </Button>
      </div>
    </aside>
  );
}
