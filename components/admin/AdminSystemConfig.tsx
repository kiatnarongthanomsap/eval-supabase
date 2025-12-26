"use client";

import React from 'react';
import {
    API_BASE_URL,
    APP_VERSION,
} from '@/lib/constants';
import { useAppContext } from '@/components/layout/AppProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Mail,
    ShieldCheck,
    Server,
    Key,
    Terminal,
    Settings,
    Calendar,
    Database,
    ShieldAlert,
    History,
    Save,
    RefreshCcw,
    Download,
    Trash2,
    Plus,
    X
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const AdminSystemConfig = () => {
    const { systemConfig, setSystemConfig, logs, resetScores, backupData, exclusions, updateSystemConfig, addExclusion, removeExclusion, allUsers } = useAppContext();
    const { toast } = useToast();
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
    const [smtpTestLogs, setSmtpTestLogs] = React.useState<string | null>(null);
    const [isLogsOpen, setIsLogsOpen] = React.useState(false);

    const handleReset = () => {
        resetScores();
        setIsConfirmOpen(false);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-12 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold font-headline tracking-tight text-slate-900 flex items-center gap-3">
                        <Settings className="w-10 h-10 text-primary" />
                        ตั้งค่าระบบ
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg font-medium">จัดการพารามิเตอร์พื้นฐานและการตั้งค่าความปลอดภัยของระบบประเมิน</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column: Core Settings */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Assessment Period Card */}
                    <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden ring-1 ring-slate-100 bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-8 pt-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold font-headline">ช่วงเวลาการประเมิน</CardTitle>
                                    <CardDescription>กำหนดกรอบเวลาสำหรับรอบการประเมินผลปัจจุบัน</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="start-date" className="text-sm font-bold text-slate-700">วันที่เริ่มต้น</Label>
                                    <Input
                                        id="start-date"
                                        type="date"
                                        className="h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:ring-primary/20 pr-4"
                                        value={systemConfig.startDate || ''}
                                        onChange={e => setSystemConfig({ ...systemConfig, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end-date" className="text-sm font-bold text-slate-700">วันที่สิ้นสุด</Label>
                                    <Input
                                        id="end-date"
                                        type="date"
                                        className="h-12 rounded-xl bg-slate-50/50 border-slate-200 focus:ring-primary/20"
                                        value={systemConfig.endDate || ''}
                                        onChange={e => setSystemConfig({ ...systemConfig, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <Button onClick={() => updateSystemConfig(systemConfig)} className="h-12 px-8 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
                                <Save className="w-4 h-4 mr-2" />
                                บันทึกช่วงเวลา
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Email & SMTP Card */}
                    <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden ring-1 ring-slate-100 bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-8 pt-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                                    <Mail className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold font-headline text-slate-800">การแจ้งเตือนและอีเมล</CardTitle>
                                    <CardDescription>ตั้งค่าการส่งสรุปผลประเมินผ่าน Server</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-8">
                            <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100/50 flex items-center justify-between group transition-all hover:bg-blue-50">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-blue-900 group-hover:text-primary transition-colors">ส่งสำเนาการประเมินให้ผู้เมิน</h4>
                                    <p className="text-sm text-blue-700/70">ระบบจะส่งสรุปผลการประเมินเข้าอีเมลของผู้ประเมินโดยอัตโนมัติ</p>
                                </div>
                                <Switch
                                    id="email-copy"
                                    className="data-[state=checked]:bg-blue-600"
                                    checked={systemConfig.sendEmailCopy}
                                    onCheckedChange={(checked) => {
                                        const newConfig = { ...systemConfig, sendEmailCopy: checked };
                                        updateSystemConfig(newConfig);
                                    }}
                                />
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-slate-800">
                                    <Server className="w-5 h-5 text-blue-600" />
                                    <h3 className="font-bold text-lg">การตั้งค่า SMTP</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <Label htmlFor="smtp-host" className="text-xs font-bold uppercase tracking-wider text-slate-500">SMTP Host</Label>
                                        <Input
                                            id="smtp-host"
                                            placeholder="smtp.example.com"
                                            className="h-11 rounded-xl bg-slate-50 focus:bg-white transition-all"
                                            value={systemConfig.smtpHost || ''}
                                            onChange={e => setSystemConfig({ ...systemConfig, smtpHost: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="smtp-port" className="text-xs font-bold uppercase tracking-wider text-slate-500">Port</Label>
                                        <Input
                                            id="smtp-port"
                                            placeholder="587"
                                            className="h-11 rounded-xl bg-slate-50 focus:bg-white transition-all"
                                            value={systemConfig.smtpPort || ''}
                                            onChange={e => setSystemConfig({ ...systemConfig, smtpPort: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="smtp-user" className="text-xs font-bold uppercase tracking-wider text-slate-500">Username / Email</Label>
                                        <Input
                                            id="smtp-user"
                                            placeholder="user@example.com"
                                            className="h-11 rounded-xl bg-slate-50 focus:bg-white transition-all"
                                            value={systemConfig.smtpUser || ''}
                                            onChange={e => setSystemConfig({ ...systemConfig, smtpUser: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="smtp-pass" className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</Label>
                                        <Input
                                            id="smtp-pass"
                                            type="password"
                                            placeholder="••••••••"
                                            className="h-11 rounded-xl bg-slate-50 focus:bg-white transition-all"
                                            value={systemConfig.smtpPass || ''}
                                            onChange={e => setSystemConfig({ ...systemConfig, smtpPass: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Encryption</Label>
                                        <Select
                                            value={systemConfig.smtpEncryption || 'tls'}
                                            onValueChange={(val: any) => setSystemConfig({ ...systemConfig, smtpEncryption: val })}
                                        >
                                            <SelectTrigger className="h-11 rounded-xl bg-slate-50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="none">None</SelectItem>
                                                <SelectItem value="ssl">SSL (Port 465)</SelectItem>
                                                <SelectItem value="tls">TLS (Port 587)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            className="flex-1 h-11 rounded-xl bg-slate-900 shadow-lg shadow-slate-200"
                                            onClick={() => updateSystemConfig(systemConfig)}
                                        >
                                            บันทึก SMTP
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 px-6"
                                            onClick={async () => {
                                                toast({ title: "Testing...", description: "กำลังทดสอบการเชื่อมต่อ SMTP" });
                                                try {
                                                    const res = await fetch(`${API_BASE_URL}/config/test-smtp`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify(systemConfig)
                                                    });
                                                    const data = await res.json();
                                                    if (data.logs) setSmtpTestLogs(data.logs);
                                                    if (data.success) {
                                                        toast({ title: "Success", description: "เชื่อมต่อ SMTP สำเร็จ" });
                                                    } else {
                                                        toast({ variant: "destructive", title: "Failed", description: data.error || data.message || "เชื่อมต่อไม่สำเร็จ" });
                                                        if (data.logs) setIsLogsOpen(true);
                                                    }
                                                } catch (err: any) {
                                                    toast({ variant: "destructive", title: "Error", description: err.message });
                                                }
                                            }}
                                        >
                                            ทดสอบ
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Dynamic Lists & Data Maintenance */}
                <div className="space-y-8">
                    {/* Data Management Card */}
                    <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden ring-1 ring-slate-100 bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6 pt-6">
                            <div className="flex items-center gap-3">
                                <Database className="w-5 h-5 text-slate-700" />
                                <CardTitle className="text-lg font-bold font-headline">จัดการข้อมูล</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <Button
                                onClick={backupData}
                                variant="outline"
                                className="w-full h-11 rounded-xl justify-start gap-3 border-slate-200 hover:bg-slate-50 hover:text-primary transition-all"
                            >
                                <Download className="w-4 h-4" />
                                สำรองข้อมูล (.json)
                            </Button>
                            <Separator className="bg-slate-100" />
                            <Button
                                onClick={() => setIsConfirmOpen(true)}
                                variant="ghost"
                                className="w-full h-11 rounded-xl justify-start gap-3 text-red-500 hover:bg-red-50 hover:text-red-600 font-medium transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                                ลบคะแนนทั้งหมด
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Exclusions Card */}
                    <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden ring-1 ring-slate-100 bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6 pt-6">
                            <div className="flex items-center gap-3">
                                <ShieldAlert className="w-5 h-5 text-amber-600" />
                                <CardTitle className="text-lg font-bold font-headline">ข้อยกเว้นการประเมิน</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <Input placeholder="Eval ID" className="h-10 rounded-lg text-sm" id="ex-eval" />
                                <Input placeholder="Target ID" className="h-10 rounded-lg text-sm" id="ex-target" />
                            </div>
                            <Input placeholder="เหตุผล" className="h-10 rounded-lg text-sm" id="ex-reason" />
                            <Button variant="outline" className="w-full h-10 rounded-lg bg-slate-50 text-slate-700" onClick={() => {
                                const evalId = parseInt((document.getElementById('ex-eval') as HTMLInputElement).value);
                                const targetId = parseInt((document.getElementById('ex-target') as HTMLInputElement).value);
                                const reason = (document.getElementById('ex-reason') as HTMLInputElement).value;
                                if (evalId && targetId) {
                                    addExclusion(evalId, targetId, reason);
                                    (document.getElementById('ex-eval') as HTMLInputElement).value = '';
                                    (document.getElementById('ex-target') as HTMLInputElement).value = '';
                                    (document.getElementById('ex-reason') as HTMLInputElement).value = '';
                                }
                            }}>
                                <Plus className="w-4 h-4 mr-2" /> เพิ่มกฎข้อยกเว้น
                            </Button>

                            <ScrollArea className="h-56 w-full rounded-2xl border border-slate-100 bg-slate-50/30 p-2 mt-2">
                                {exclusions.length > 0 ? exclusions.map((ex, i) => {
                                    const evaluator = allUsers.find(u => u.orgId === ex.evaluatorId);
                                    const target = allUsers.find(u => u.orgId === ex.targetId);
                                    return (
                                        <div key={i} className="p-3 mb-2 bg-white rounded-xl border border-slate-100 shadow-sm flex justify-between items-start group transition-all">
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-slate-800">
                                                    {evaluator?.name || ex.evaluatorId} → {target?.name || ex.targetId}
                                                </p>
                                                <p className="text-[11px] text-amber-600 font-medium italic">{ex.reason}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500 rounded-lg" onClick={() => ex.id && removeExclusion(ex.id)}>
                                                <X className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    )
                                }) : <p className="text-slate-400 text-center py-10 text-xs">ไม่มีรายการข้อยกเว้น</p>}
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Activity Logs Card */}
                    <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden ring-1 ring-slate-100 bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6 pt-6">
                            <div className="flex items-center gap-3">
                                <History className="w-5 h-5 text-indigo-600" />
                                <CardTitle className="text-lg font-bold font-headline">กิจกรรมล่าสุด</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ScrollArea className="h-72 w-full rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                                {logs.length > 0 ? logs.slice().reverse().map((log, i) => (
                                    <div key={i} className="mb-4 pb-4 border-b border-slate-200/50 last:border-0 last:pb-0">
                                        <p className="font-mono text-[9px] text-indigo-500 font-bold mb-1 opacity-70">
                                            {new Date(log.timestamp).toLocaleString('th-TH')}
                                        </p>
                                        <p className="text-sm font-medium text-slate-700 leading-snug">
                                            <span className="text-indigo-600 font-bold">{log.user}:</span> {log.message}
                                        </p>
                                    </div>
                                )) : <p className="text-slate-400 text-center py-20 text-xs">ยังไม่มีข้อมูลกิจกรรม</p>}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmDialog
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                onConfirm={handleReset}
                title="ล้างข้อมูลการประเมิน?"
                description="คุณแน่ใจหรือไม่ที่จะลบคะแนนและความคิดเห็นทั้งหมด? ข้อมูลนี้ไม่สามารถกู้คืนได้ และควรสำรองข้อมูลก่อนดำเนินการ"
            />

            <Dialog open={isLogsOpen} onOpenChange={setIsLogsOpen}>
                <DialogContent className="max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden border-0 shadow-2xl p-0">
                    <div className="bg-slate-900 text-white p-6 border-b border-slate-800">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                                <Terminal className="w-6 h-6 text-emerald-400" />
                                SMTP Debug Output
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                    <div className="p-0 bg-slate-950">
                        <ScrollArea className="h-[500px] w-full p-6">
                            <pre className="text-xs font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed">
                                {smtpTestLogs || 'Waiting for log data...'}
                            </pre>
                        </ScrollArea>
                    </div>
                    <div className="bg-slate-900 p-4 flex justify-end">
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-500 rounded-xl px-8 h-12 text-white font-bold"
                            onClick={() => setIsLogsOpen(false)}
                        >
                            รับทราบ
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminSystemConfig;
