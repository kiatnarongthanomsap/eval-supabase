"use client";

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/components/layout/AppProvider';
import { ROLES, API_BASE_URL } from '@/lib/constants';
import { findTargets } from '@/lib/helpers';
import { ArrowLeft, Footprints, TrendingUp, Search, Building, Users, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import type { User, Target } from '@/lib/types';

const ProgressPage = () => {
    const { goBack, allUsers, fetchReportData, getCriteriaForUser, exclusions } = useAppContext();
    const { toast } = useToast();
    const [rawScores, setRawScores] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [filterName, setFilterName] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'done' | 'pending'>('all');

    // SMS State
    const [isSmsOpen, setIsSmsOpen] = useState(false);
    const [smsMessage, setSmsMessage] = useState("กรุณาดำเนินการประเมินให้เรียบร้อย ภายในกำหนด");
    const [isSendingSms, setIsSendingSms] = useState(false);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            setSmsMessage(prev => `${prev}\n\n${window.location.origin}`);
        }
        const load = async () => {
            setLoading(true);
            // Fetch RAW data: { all_scores: { evaluatorId: { targetId: { criteriaId: score } } } }
            const data = await fetchReportData({ raw: true });
            console.log("DEBUG: fetchReportData result:", data ? Object.keys(data) : "null");
            if (data && data.all_scores) {
                console.log("DEBUG: all_scores sample keys:", Object.keys(data.all_scores).slice(0, 5));
                setRawScores(data.all_scores);
            } else {
                console.warn("DEBUG: No all_scores found in response");
            }
            setLoading(false);
        };
        load();
    }, [fetchReportData]);

    // 1. Calculate Evaluator Progress (Perspective: Who has finished their job?)
    const evaluatorProgressData = useMemo(() => {
        console.log("DEBUG: Starting evaluatorProgressData calc. AllUsers count:", allUsers.length);

        return allUsers
            .filter(u => u.isActive) // Filter only active users (including Committee)
            .map((evaluator, idx) => {
                if (idx < 3) console.log(`DEBUG: Processing user ${evaluator.name} (ID: ${evaluator.internalId})`);
                // Find who this evaluator is supposed to evaluate
                const targets = findTargets(evaluator, allUsers, exclusions);

                // Filter out Committee members from being evaluated (AssessmentPage logic)
                const validTargets = targets.filter(t => t.role !== ROLES.COMMITTEE);

                const totalTargets = validTargets.length;
                let peopleCompletedCount = 0;
                let completedCriteriaCount = 0; // Items
                let totalCriteriaCount = 0;     // Items

                // If no one to evaluate, they are technically "Done" (progress 100%) or "N/A"
                if (totalTargets === 0) {
                    return {
                        ...evaluator,
                        progress: 100,
                        completedCount: 0,
                        totalCount: 0,
                        peopleCompleted: 0,
                        peopleTotal: 0,
                        isDone: true,
                        hasDuty: false
                    };
                }

                // Debug matching
                const evaluatorKey = String(evaluator.internalId);
                const myScores = rawScores[evaluatorKey] || rawScores[Number(evaluator.internalId)] || {};

                if (evaluatorKey === "19" || evaluatorKey === "21") { // Debug specific users (Kiatnarong/Admin)
                    console.log(`Debug ${evaluator.name} (${evaluatorKey}):`, {
                        rawScoresKeys: Object.keys(rawScores).slice(0, 5),
                        myScoresSize: Object.keys(myScores).length,
                        foundMyScores: !!rawScores[evaluatorKey],
                        evaluatorIdType: typeof evaluator.internalId,
                        targetsCount: validTargets.length
                    });
                }

                validTargets.forEach(target => {
                    const criteria = getCriteriaForUser(target);
                    const targetTotal = criteria.length;

                    if (targetTotal === 0) {
                        // If target has no criteria, they are automatically "done" as a person, but contribute 0 items
                        peopleCompletedCount++;
                        return;
                    }

                    totalCriteriaCount += targetTotal;

                    // Check criteria completion
                    const targetKey = String(target.internalId);
                    const targetScores = myScores[targetKey] || {};
                    let targetScoredThisPerson = 0;

                    criteria.forEach(c => {
                        if (targetScores[c.id] !== undefined && targetScores[c.id] !== null) {
                            targetScoredThisPerson++;
                            completedCriteriaCount++;
                        }
                    });

                    // Check if whole target is done
                    if (targetScoredThisPerson === targetTotal) {
                        peopleCompletedCount++;
                    }
                });

                const progress = totalTargets > 0 ? Math.round((peopleCompletedCount / totalTargets) * 100) : 0;

                return {
                    ...evaluator,
                    progress,
                    completedCount: completedCriteriaCount, // Items Scored
                    totalCount: totalCriteriaCount,         // Items Total
                    peopleCompleted: peopleCompletedCount,
                    peopleTotal: totalTargets,
                    isDone: progress === 100,
                    hasDuty: totalCriteriaCount > 0
                };
            });
    }, [allUsers, rawScores, getCriteriaForUser, exclusions]);

    // 2. Calculate Line (Dept) Progress - Based on Evaluators in that Dept
    const deptProgressData = useMemo(() => {
        const deptMap: { [key: string]: { totalTargets: number; completedTargets: number; totalEvaluators: number; completedEvaluators: number } } = {};

        evaluatorProgressData.forEach(u => {
            if (!u.hasDuty) return;

            if (!deptMap[u.dept]) {
                deptMap[u.dept] = { totalTargets: 0, completedTargets: 0, totalEvaluators: 0, completedEvaluators: 0 };
            }
            deptMap[u.dept].totalEvaluators += 1;
            deptMap[u.dept].totalTargets += u.peopleTotal;
            deptMap[u.dept].completedTargets += u.peopleCompleted;

            if (u.isDone) {
                deptMap[u.dept].completedEvaluators += 1;
            }
        });

        return Object.entries(deptMap).map(([dept, data]) => ({
            dept,
            progress: data.totalTargets > 0 ? Math.round((data.completedTargets / data.totalTargets) * 100) : 0,
            completed: data.completedEvaluators,
            total: data.totalEvaluators,
            targetsCompleted: data.completedTargets,
            targetsTotal: data.totalTargets
        })).sort((a, b) => b.progress - a.progress);
    }, [evaluatorProgressData]);

    const stats = useMemo(() => {
        const active = evaluatorProgressData.filter(u => u.hasDuty);
        return {
            all: active.length,
            done: active.filter(u => u.isDone).length,
            pending: active.filter(u => !u.isDone).length
        };
    }, [evaluatorProgressData]);

    // Filtered Users (Evaluators)
    const filteredEvaluators = useMemo(() => {
        return evaluatorProgressData
            .filter(u => u.hasDuty) // Only show people who actually have to evaluate someone
            .filter(u => {
                if (statusFilter === 'done') return u.isDone;
                if (statusFilter === 'pending') return !u.isDone;
                return true;
            })
            .filter(u => u.name.toLowerCase().includes(filterName.toLowerCase()) || u.dept.toLowerCase().includes(filterName.toLowerCase()))
            .sort((a, b) => {
                const rolePriority = [ROLES.COMMITTEE, ROLES.MANAGER, ROLES.ASST, ROLES.HEAD, ROLES.STAFF];
                const priorityA = rolePriority.indexOf(a.role);
                const priorityB = rolePriority.indexOf(b.role);

                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }
                return a.name.localeCompare(b.name, 'th');
            });
    }, [evaluatorProgressData, filterName, statusFilter]);

    // List of users who haven't finished (for SMS)
    const incompleteUsers = useMemo(() => {
        return filteredEvaluators.filter(u => !u.isDone && u.hasDuty && u.mobile);
    }, [filteredEvaluators]);

    const handleSendSms = async () => {
        setIsSendingSms(true);
        try {
            let successCount = 0;
            // Send in batches or parallel? Parallel is properly fine for small numbers, but maybe limit concurrency if needed.
            // Using Promise.all for simplicity.
            const promises = incompleteUsers.map(async (u) => {
                if (!u.mobile) return;
                try {
                    const res = await fetch(`${API_BASE_URL}/otp/request?mobile_no=${u.mobile}&msg=${encodeURIComponent(smsMessage)}`);
                    if (res.ok) successCount++;
                } catch (e) {
                    console.error(`Failed to send SMS to ${u.name}`, e);
                }
            });

            await Promise.all(promises);

            toast({
                title: "ส่งข้อความสำเร็จ",
                description: `ส่งข้อความแจ้งเตือนเรียบร้อยแล้ว (${successCount}/${incompleteUsers.length} คน)`
            });
            setIsSmsOpen(false);
        } catch (error) {
            console.error("SMS Error:", error);
            toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง", variant: "destructive" });
        } finally {
            setIsSendingSms(false);
        }
    };

    const totalProgress = useMemo(() => {
        const activeEvaluators = evaluatorProgressData.filter(u => u.hasDuty);
        if (activeEvaluators.length === 0) return 0;

        const totalPeopleTargets = activeEvaluators.reduce((sum, u) => sum + u.peopleTotal, 0);
        const totalPeopleCompleted = activeEvaluators.reduce((sum, u) => sum + u.peopleCompleted, 0);

        return totalPeopleTargets > 0 ? Math.round((totalPeopleCompleted / totalPeopleTargets) * 100) : 0;
    }, [evaluatorProgressData]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex flex-col animate-fade-in font-sans">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm px-6 py-4 flex items-center gap-4 sticky top-0 z-20 border-b border-white/20">
                <Button onClick={goBack} variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-100"><ArrowLeft className="h-5 w-5 text-gray-600" /></Button>
                <h1 className="text-xl font-bold font-heading text-gray-800 tracking-tight flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-600 p-2 rounded-xl"><Footprints className="w-5 h-5" /></span>
                    ติดตามความคืบหน้า (Monitoring)
                </h1>
                <div className="ml-auto flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 hidden md:flex border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        onClick={() => setIsSmsOpen(true)}
                        disabled={incompleteUsers.length === 0}
                    >
                        <MessageSquare className="w-4 h-4" />
                        แจ้งเตือน SMS ({incompleteUsers.length})
                    </Button>
                    <div className="text-right hidden md:block">
                        <div className="text-base font-bold text-gray-700">ภาพรวมทั้งองค์กร</div>
                        <div className="text-sm text-gray-500">{totalProgress}% ผู้ประเมินเสร็จสิ้น</div>
                    </div>
                    <div className="w-32 hidden md:block">
                        <Progress value={totalProgress} className="h-2" />
                    </div>
                </div>
            </header>

            <Dialog open={isSmsOpen} onOpenChange={setIsSmsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>ส่ง SMS แจ้งเตือน</DialogTitle>
                        <DialogDescription>
                            ส่งข้อความแจ้งเตือนไปยังผู้ที่ยังประเมินไม่เสร็จสิ้นจำนวน {incompleteUsers.length} คน
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <label className="text-base font-medium mb-2 block">ข้อความ:</label>
                        <Textarea
                            value={smsMessage}
                            onChange={(e) => setSmsMessage(e.target.value)}
                            placeholder="ระบุข้อความ..."
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSmsOpen(false)} disabled={isSendingSms}>ยกเลิก</Button>
                        <Button onClick={handleSendSms} disabled={isSendingSms || !smsMessage.trim()}>
                            {isSendingSms ? <span className="animate-spin mr-2">⏳</span> : <MessageSquare className="w-4 h-4 mr-2" />}
                            ส่งข้อความ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">

                {/* Section 1: Line of Business Progress */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Building className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-lg font-bold text-gray-800">ความคืบหน้าตามสายงาน (Department Progress)</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {deptProgressData.map((dept) => (
                            <Card key={dept.dept} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 ring-1 ring-gray-100 overflow-hidden group">
                                <CardHeader className="pb-2 bg-gradient-to-br from-white to-gray-50/50">
                                    <div className="flex justify-between items-start w-full">
                                        <CardTitle className="text-base font-bold text-gray-800 line-clamp-1 flex-1" title={dept.dept}>{dept.dept}</CardTitle>
                                        <Badge variant={dept.progress === 100 ? "default" : "secondary"} className={dept.progress === 100 ? "bg-green-500 hover:bg-green-600" : ""}>
                                            {dept.progress}%
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-xs">
                                        เสร็จสิ้น {dept.targetsCompleted} จาก {dept.targetsTotal} คน
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <Progress value={dept.progress} className={`h-2 ${dept.progress === 100 ? "bg-green-100 [&>div]:bg-green-500" : "bg-indigo-50 [&>div]:bg-indigo-500"}`} />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Section 2: Individual Evaluator Progress */}
                <section>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-lg font-bold text-gray-800">สถานะผู้ประเมิน (Evaluator Status)</h2>
                        </div>
                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
                            <div className="flex p-1 bg-white ring-1 ring-gray-200 rounded-2xl shadow-sm">
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${statusFilter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    ทั้งหมด <span className={`px-1.5 py-0.5 rounded-md text-xs ${statusFilter === 'all' ? 'bg-white/20' : 'bg-gray-100'}`}>{stats.all}</span>
                                </button>
                                <button
                                    onClick={() => setStatusFilter('done')}
                                    className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${statusFilter === 'done' ? 'bg-green-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    ครบ <span className={`px-1.5 py-0.5 rounded-md text-xs ${statusFilter === 'done' ? 'bg-white/20' : 'bg-gray-100'}`}>{stats.done}</span>
                                </button>
                                <button
                                    onClick={() => setStatusFilter('pending')}
                                    className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    ไม่ครบ <span className={`px-1.5 py-0.5 rounded-md text-xs ${statusFilter === 'pending' ? 'bg-white/20' : 'bg-gray-100'}`}>{stats.pending}</span>
                                </button>
                            </div>
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="ค้นหาผู้ประเมิน..."
                                    className="pl-10 h-10 rounded-full bg-white shadow-sm border-gray-200 focus:border-indigo-300 focus:ring-indigo-100"
                                    value={filterName}
                                    onChange={e => setFilterName(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-100/50 border border-white ring-1 ring-gray-200/50 overflow-hidden">

                        {loading ? (
                            <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
                                <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                                กำลังประมวลผลข้อมูล...
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 divide-x divide-y divide-gray-100">
                                {filteredEvaluators.map(user => (
                                    <div key={user.internalId} className="p-4 hover:bg-white/80 transition-colors flex items-center gap-4 group">
                                        <div className="relative">
                                            <Image
                                                src={user.img}
                                                width={48}
                                                height={48}
                                                className={`w-12 h-12 rounded-full border-2 object-cover ${user.isDone ? 'border-green-500' : 'border-gray-200 group-hover:border-indigo-300'}`}
                                                alt={user.name}
                                            />
                                            {user.isDone && (
                                                <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border-2 border-white">
                                                    <TrendingUp className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <h4 className="text-base font-bold text-gray-900 truncate pr-2">{user.name}</h4>
                                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${user.isDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {user.progress}%
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 truncate mb-2">{user.position} <span className="mx-1">•</span> {user.peopleTotal} คนที่ต้องประเมิน</p>

                                            <div className="flex items-center gap-2">
                                                <Progress value={user.progress} className={`h-1.5 flex-1 ${user.isDone ? "[&>div]:bg-green-500 bg-green-100" : "[&>div]:bg-purple-500 bg-purple-50"}`} />
                                                <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{user.peopleCompleted}/{user.peopleTotal} คน</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {filteredEvaluators.length === 0 && (
                                    <div className="col-span-full p-12 text-center text-gray-400">
                                        {evaluatorProgressData.some(u => u.hasDuty) ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีผู้ประเมินที่มีภาระงาน'}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

            </main>
        </div>
    );
};

export default ProgressPage;
