"use client";

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/components/layout/AppProvider';
import { ROLES } from '@/lib/constants';
import { ArrowLeft, PieChart, TrendingUp, User, Search, BarChart3, Users, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const ProgressPage = () => {
    const { goBack, allUsers, fetchReportData, getCriteriaForUser } = useAppContext();
    const [localScores, setLocalScores] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [filterName, setFilterName] = useState('');

    React.useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await fetchReportData();
            if (data) {
                setLocalScores(data.scores || {});
            }
            setLoading(false);
        };
        load();
    }, [fetchReportData]);

    // 1. Calculate Individual Progress
    const userProgressData = useMemo(() => {
        return allUsers
            .filter(u => u.role !== ROLES.COMMITTEE && u.isActive)
            .map(user => {
                const criteria = getCriteriaForUser(user);
                const totalCriteria = criteria.length;
                if (totalCriteria === 0) return { ...user, progress: 0, scoredCount: 0, totalCount: 0, isDone: true }; // No criteria = done

                const scores = localScores[user.internalId] || {};
                const scoredCount = criteria.filter(c => scores[c.id] !== undefined && scores[c.id] !== null).length;
                const progress = Math.round((scoredCount / totalCriteria) * 100);

                return {
                    ...user,
                    progress,
                    scoredCount,
                    totalCount: totalCriteria,
                    isDone: progress === 100
                };
            });
    }, [allUsers, localScores, getCriteriaForUser]);

    // 2. Calculate Line (Dept) Progress
    const deptProgressData = useMemo(() => {
        const deptMap: { [key: string]: { totalUsers: number; completedUsers: number } } = {};

        userProgressData.forEach(u => {
            if (!deptMap[u.dept]) {
                deptMap[u.dept] = { totalUsers: 0, completedUsers: 0 };
            }
            deptMap[u.dept].totalUsers += 1;
            if (u.isDone) {
                deptMap[u.dept].completedUsers += 1;
            }
        });

        return Object.entries(deptMap).map(([dept, data]) => ({
            dept,
            progress: data.totalUsers > 0 ? Math.round((data.completedUsers / data.totalUsers) * 100) : 0,
            completed: data.completedUsers,
            total: data.totalUsers
        })).sort((a, b) => b.progress - a.progress);
    }, [userProgressData]);

    // Filtered Users
    const filteredUsers = useMemo(() => {
        return userProgressData
            .filter(u => u.name.toLowerCase().includes(filterName.toLowerCase()) || u.dept.toLowerCase().includes(filterName.toLowerCase()))
            .sort((a, b) => a.progress - b.progress); // Show incomplete first
    }, [userProgressData, filterName]);

    const totalProgress = useMemo(() => {
        if (userProgressData.length === 0) return 0;
        const done = userProgressData.filter(u => u.isDone).length;
        return Math.round((done / userProgressData.length) * 100);
    }, [userProgressData]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex flex-col animate-fade-in font-sans">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm px-6 py-4 flex items-center gap-4 sticky top-0 z-20 border-b border-white/20">
                <Button onClick={goBack} variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-100"><ArrowLeft className="h-5 w-5 text-gray-600" /></Button>
                <h1 className="text-xl font-bold font-headline text-gray-800 tracking-tight flex items-center gap-2">
                    <span className="bg-primary/10 text-primary p-2 rounded-xl"><PieChart className="w-5 h-5" /></span>
                    รายงานความคืบหน้าการประเมิน (Assessment Progress)
                </h1>
                <div className="ml-auto flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-bold text-gray-700">ภาพรวมทั้งองค์กร</div>
                        <div className="text-xs text-gray-500">{totalProgress}% เสร็จสมบูรณ์</div>
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

                {/* Section 2: Individual Progress */}
                <section>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-lg font-bold text-gray-800">ความคืบหน้ารายบุคคล (Individual Progress)</h2>
                        </div>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="ค้นหาพนักงาน..."
                                className="pl-10 h-10 rounded-full bg-white shadow-sm border-gray-200 focus:border-indigo-300 focus:ring-indigo-100"
                                value={filterName}
                                onChange={e => setFilterName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-100/50 border border-white ring-1 ring-gray-200/50 overflow-hidden">

                        {loading ? (
                            <div className="p-12 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 divide-x divide-y divide-gray-100">
                                {filteredUsers.map(user => (
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
                                            <p className="text-xs text-gray-500 truncate mb-2">{user.position}</p>

                                            <div className="flex items-center gap-2">
                                                <Progress value={user.progress} className={`h-1.5 flex-1 ${user.isDone ? "[&>div]:bg-green-500 bg-green-100" : "[&>div]:bg-indigo-500 bg-indigo-50"}`} />
                                                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{user.scoredCount}/{user.totalCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {filteredUsers.length === 0 && (
                                    <div className="col-span-full p-12 text-center text-gray-400">
                                        ไม่มีข้อมูลที่ตรงกับคำค้นหา
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
