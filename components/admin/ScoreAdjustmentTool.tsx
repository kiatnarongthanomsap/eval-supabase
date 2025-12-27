"use client";
import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/components/layout/AppProvider';
import { getAiSuggestions } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import type { SuggestScoreAdjustmentsOutput } from '@/ai/flows/suggest-score-adjustments';
import { Badge } from '@/components/ui/badge';

const ScoreAdjustmentTool = () => {
    const { allUsers, scores, comments, getCriteriaForUser } = useAppContext();
    const { toast } = useToast();

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<SuggestScoreAdjustmentsOutput | null>(null);

    const activeUsers = useMemo(() => {
        return allUsers
            .filter(u => u.isActive)
            .map(u => {
                const userScores = scores[u.internalId] || {};
                const criteria = getCriteriaForUser(u);
                const scoreValues = Object.values(userScores);
                const avgScore = scoreValues.length > 0 ? scoreValues.reduce((a, b) => a + b, 0) / criteria.length : 0;

                return {
                    ...u,
                    hasComments: !!comments[u.internalId],
                    isLowScore: avgScore > 0 && avgScore < 2.5 // Adjust threshold as needed
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [allUsers, scores, comments, getCriteriaForUser]);

    const selectedUser = useMemo(() => {
        return allUsers.find(u => u.internalId === selectedUserId) || null;
    }, [selectedUserId, allUsers]);

    const userCriteria = useMemo(() => {
        if (!selectedUser) return [];
        return getCriteriaForUser(selectedUser);
    }, [selectedUser, getCriteriaForUser]);

    const currentScores = useMemo(() => {
        if (!selectedUser) return {};
        return scores[selectedUser.internalId] || {};
    }, [selectedUser, scores]);

    const handleGetSuggestions = async () => {
        if (!selectedUser) {
            toast({ variant: 'destructive', title: 'ไม่ได้เลือกพนักงาน' });
            return;
        }

        setIsLoading(true);
        setSuggestions(null);

        const filledScores = userCriteria.reduce((acc, crit) => {
            acc[crit.id] = currentScores[crit.id] || 0;
            return acc;
        }, {} as Record<string, number>);

        const result = await getAiSuggestions({
            position: selectedUser.position,
            department: selectedUser.dept,
            currentScores: filledScores,
        });

        setIsLoading(false);

        if (result.success) {
            setSuggestions(result.data);
            toast({ title: 'ข้อเสนอแนะจาก AI พร้อมแล้ว', description: `สร้างคำแนะนำสำหรับ ${selectedUser.name} เรียบร้อยแล้ว` });
        } else {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: result.error });
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-heading">เครื่องมือแนะนำคะแนนโดย AI</h1>
            <Card>
                <CardHeader>
                    <CardTitle>วิเคราะห์คะแนนพนักงาน</CardTitle>
                    <CardDescription>เลือกพนักงานเพื่อดูคะแนนปัจจุบันและรับคำแนะนำจาก AI สำหรับการปรับคะแนนที่เป็นธรรมตามบทบาทและแผนกของพวกเขา</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <Select onValueChange={setSelectedUserId}>
                            <SelectTrigger className="w-full sm:w-[300px]">
                                <SelectValue placeholder="เลือกพนักงาน..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {activeUsers.map(user => (
                                        <SelectItem key={user.internalId} value={user.internalId}>
                                            <div className="flex items-center justify-between w-full min-w-[280px]">
                                                <div className="flex items-center gap-2">
                                                    <Image src={user.img} width={24} height={24} className="rounded-full w-6 h-6 object-cover" alt={user.name} />
                                                    <span>{user.name}</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    {user.isLowScore && (
                                                        <Badge variant="outline" className="text-[10px] h-4 px-1 bg-red-50 text-red-600 border-red-100 font-bold">Low</Badge>
                                                    )}
                                                    {user.hasComments && (
                                                        <Badge variant="outline" className="text-[10px] h-4 px-1 bg-amber-50 text-amber-600 border-amber-100 font-bold">Text</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleGetSuggestions} disabled={!selectedUserId || isLoading} className="w-full sm:w-auto">
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            รับคำแนะนำจาก AI
                        </Button>
                    </div>

                    {selectedUser && (
                        <Card className="bg-muted/50">
                            <CardHeader>
                                <CardTitle className="text-lg">ผลลัพธ์สำหรับ: {selectedUser.name}</CardTitle>
                                <CardDescription>ตำแหน่ง: {selectedUser.position} | แผนก: {selectedUser.dept}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>หลักเกณฑ์</TableHead>
                                                <TableHead className="text-center">คะแนนปัจจุบัน</TableHead>
                                                <TableHead className="text-center">คำแนะนำ AI</TableHead>
                                                <TableHead className="text-center">คะแนนที่ปรับ</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {userCriteria.map(c => {
                                                const current = currentScores[c.id] || 0;
                                                const adjustment = suggestions ? (suggestions[c.id] || 0) : null;
                                                const adjusted = adjustment !== null ? Math.max(0, Math.min(4, current + adjustment)) : null;

                                                return (
                                                    <TableRow key={c.id}>
                                                        <TableCell className="font-medium">{c.text}</TableCell>
                                                        <TableCell className="text-center font-bold text-lg">{current}</TableCell>
                                                        <TableCell className="text-center">
                                                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> :
                                                                adjustment !== null && adjustment !== 0 ? (
                                                                    <Badge variant={adjustment > 0 ? "default" : "destructive"} className="bg-green-500">
                                                                        {adjustment > 0 ? `+${adjustment.toFixed(2)}` : adjustment.toFixed(2)}
                                                                    </Badge>
                                                                ) : adjustment === 0 ? <span className="text-muted-foreground text-xs">ไม่มีการเปลี่ยนแปลง</span> : <span className="text-muted-foreground text-xs">-</span>
                                                            }
                                                        </TableCell>
                                                        <TableCell className="text-center font-bold text-lg">
                                                            {adjusted !== null && current !== adjusted && (
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <span className="text-muted-foreground line-through">{current}</span>
                                                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="text-primary">{adjusted.toFixed(2)}</span>
                                                                </div>
                                                            )}
                                                            {adjusted !== null && current === adjusted && (
                                                                <span>{current}</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ScoreAdjustmentTool;
