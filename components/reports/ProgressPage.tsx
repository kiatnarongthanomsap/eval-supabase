"use client";

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/components/layout/AppProvider';
import { ROLES } from '@/lib/constants';
import { findTargets } from '@/lib/helpers';
import { ArrowLeft, PieChart, TrendingUp, Search, Building, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import type { User, Target } from '@/lib/types';

const ProgressPage = () => {
    const { goBack, allUsers, fetchReportData, getCriteriaForUser, exclusions } = useAppContext();
    const [rawScores, setRawScores] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [filterName, setFilterName] = useState('');

    React.useEffect(() => {
        const load = async () => {
            setLoading(true);
            // Fetch RAW data: { all_scores: { evaluatorId: { targetId: { criteriaId: score } } } }
            const data = await fetchReportData({ raw: true });
            if (data && data.all_scores) {
                setRawScores(data.all_scores);
            }
            setLoading(false);
        };
        load();
    }, [fetchReportData]);

    // 1. Calculate Evaluator Progress (Perspective: Who has finished their job?)
    const evaluatorProgressData = useMemo(() => {
        return allUsers
            .filter(u => u.isActive && u.role !== ROLES.COMMITTEE) // Filter active non-committee users
            .map(evaluator => {
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

                const myScores = rawScores[evaluator.internalId] || {};

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
                    const targetScores = myScores[target.internalId] || {};
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

                const progress = totalCriteriaCount > 0 ? Math.round((completedCriteriaCount / totalCriteriaCount) * 100) : 0;

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
        const deptMap: { [key: string]: { totalEvaluators: number; completedEvaluators: number } } = {};

        evaluatorProgressData.forEach(u => {
            if (!u.hasDuty) return; // Only count those who have work to do? Or count everyone?
            // Usually "Department Progress" means "Did everyone in this dept finish their job?"
            // So we count everyone who has a duty.

            if (!deptMap[u.dept]) {
                deptMap[u.dept] = { totalEvaluators: 0, completedEvaluators: 0 };
            }
            deptMap[u.dept].totalEvaluators += 1;
            if (u.isDone) {
                deptMap[u.dept].completedEvaluators += 1;
            }
        });

        return Object.entries(deptMap).map(([dept, data]) => ({
            dept,
            progress: data.totalEvaluators > 0 ? Math.round((data.completedEvaluators / data.totalEvaluators) * 100) : 0,
            completed: data.completedEvaluators,
            total: data.totalEvaluators
        })).sort((a, b) => b.progress - a.progress);
    }, [evaluatorProgressData]);

    // Filtered Users (Evaluators)
    const filteredEvaluators = useMemo(() => {
        return evaluatorProgressData
            .filter(u => u.hasDuty) // Only show people who actually have to evaluate someone
            .filter(u => u.name.toLowerCase().includes(filterName.toLowerCase()) || u.dept.toLowerCase().includes(filterName.toLowerCase()))
            .sort((a, b) => a.progress - b.progress); // Show incomplete first
    }, [evaluatorProgressData, filterName]);

    const totalProgress = useMemo(() => {
        const activeEvaluators = evaluatorProgressData.filter(u => u.hasDuty);
        if (activeEvaluators.length === 0) return 0;
        const done = activeEvaluators.filter(u => u.isDone).length;
        return Math.round((done / activeEvaluators.length) * 100);
    }, [evaluatorProgressData]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex flex-col animate-fade-in font-sans">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm px-6 py-4 flex items-center gap-4 sticky top-0 z-20 border-b border-white/20">
                <Button onClick={goBack} variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-100"><ArrowLeft className="h-5 w-5 text-gray-600" /></Button>
                <h1 className="text-xl font-bold font-headline text-gray-800 tracking-tight flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-600 p-2 rounded-xl"><PieChart className="w-5 h-5" /></span>
                    ติดตามความคืบหน้า (Monitoring)
                </h1>
                <div className="ml-auto flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-bold text-gray-700">ภาพรวมทั้งองค์กร</div>
                        <div className="text-xs text-gray-500">{totalProgress}% ผู้ประเมินเสร็จสิ้น</div>
                    </div>
                    <div className="w-32 hidden md:block">
                        <Progress value={totalProgress} className="h-2" />
                    </div>
                </div>
            </header>

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
                                    <div className="flex justifying-between items-start w-full">
                                        <CardTitle className="text-base font-bold text-gray-800 line-clamp-1 flex-1" title={dept.dept}>{dept.dept}</CardTitle>
                                        <Badge variant={dept.progress === 100 ? "default" : "secondary"} className={dept.progress === 100 ? "bg-green-500 hover:bg-green-600" : ""}>
                                            {dept.progress}%
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-xs">
                                        เสร็จสิ้น {dept.completed} จาก {dept.total} คน
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
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="ค้นหาผู้ประเมิน..."
                                className="pl-10 h-10 rounded-full bg-white shadow-sm border-gray-200 focus:border-indigo-300 focus:ring-indigo-100"
                                value={filterName}
                                onChange={e => setFilterName(e.target.value)}
                            />
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
                                                <h4 className="text-sm font-bold text-gray-900 truncate pr-2">{user.name}</h4>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${user.isDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {user.progress}%
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate mb-2">{user.position} <span className="mx-1">•</span> {user.peopleTotal} คนที่ต้องประเมิน</p>

                                            <div className="flex items-center gap-2">
                                                <Progress value={user.progress} className={`h-1.5 flex-1 ${user.isDone ? "[&>div]:bg-green-500 bg-green-100" : "[&>div]:bg-purple-500 bg-purple-50"}`} />
                                                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{user.completedCount}/{user.totalCount} ข้อ</span>
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
