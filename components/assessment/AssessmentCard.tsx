import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, ChevronRight, ChevronDown, ChevronUp, Crown, Briefcase, UserCog, Shield, User } from 'lucide-react';
import Image from 'next/image';
import { formatSalaryGroup, calculateTotal } from '@/lib/helpers';
import { ROLES } from '@/lib/constants';
import type { Target, Role, ScoreData, Criteria } from '@/lib/types';

interface AssessmentCardProps {
    targets: Target[];
    groupLabel: string;
    groupKey: string;
    scores: ScoreData;
    getCriteriaForUser: (user: Target) => Criteria[];
    navigateToIndividual: (user: Target) => void;
    navigateToGroup: (group: string) => void;
}

export const AssessmentCard = ({
    targets,
    groupLabel,
    groupKey,
    scores,
    getCriteriaForUser,
    navigateToIndividual,
    navigateToGroup
}: AssessmentCardProps) => {
    const isGroupComplete = targets.every(t => {
        const personCriteria = getCriteriaForUser(t);
        if (personCriteria.length === 0) return true;
        const personScores = scores[t.internalId] || {};
        return personCriteria.every(c => personScores[c.id]);
    });

    const getIcon = () => {
        // Always show role-based icons since we only group by role now
        switch (groupKey) {
            case ROLES.COMMITTEE: return <Crown className="h-7 w-7 text-yellow-600" />;
            case ROLES.MANAGER: return <Briefcase className="h-7 w-7 text-blue-600" />;
            case ROLES.ASST: return <UserCog className="h-7 w-7 text-indigo-600" />;
            case ROLES.HEAD: return <Shield className="h-7 w-7 text-purple-600" />;
            case ROLES.STAFF: return <User className="h-7 w-7 text-slate-600" />;
            default: return <Users className="h-7 w-7 text-muted-foreground" />;
        }
    };

    return (
        <Card className="overflow-hidden shadow-lg shadow-indigo-100 hover:shadow-2xl hover:shadow-indigo-200 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 flex flex-col h-full rounded-3xl border-0 bg-white/90 backdrop-blur-sm group/card ring-1 ring-gray-50 active:scale-[0.98]">
            <CardHeader className="pb-3 pt-6 px-6">
                <div className="flex justify-between items-start">
                    <div className={`p-4 rounded-2xl bg-indigo-50/50 group-hover/card:bg-indigo-100 transition-colors duration-300 shadow-sm`}>
                        {getIcon()}
                    </div>
                    <div className="text-right">
                        {isGroupComplete ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-none px-3 py-1 rounded-full font-medium shadow-sm">
                                <CheckCircle className="w-3 h-3 mr-1" /> ครบถ้วน
                            </Badge>
                        ) : (
                            <div className="flex flex-col items-end">
                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">จำนวน</p>
                                <p className="font-bold text-2xl text-gray-800 leading-none mt-1">{targets.length} <span className="text-base font-normal text-gray-400">คน</span></p>
                            </div>
                        )}
                    </div>
                </div>
                <CardTitle className="font-headline pt-5 truncate text-xl text-gray-800" title={groupLabel}>{groupLabel}</CardTitle>
                <CardDescription className="h-5 text-base font-medium opacity-80">{targets[0]?.dept || 'ตำแหน่ง'}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex flex-col px-6">
                {/* Mobile View */}
                <div className="md:hidden mt-4 space-y-3">
                    {targets.map((t) => {
                        const personCriteria = getCriteriaForUser(t);
                        const isDone = personCriteria.length > 0 && personCriteria.every(c => scores[t.internalId]?.[c.id]);
                        const totalScore = Math.round(calculateTotal(t.internalId, scores, personCriteria));

                        return (
                            <div key={t.internalId} onClick={() => navigateToIndividual(t)} className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 border border-gray-100 active:scale-[0.98] active:bg-indigo-50 transition-all cursor-pointer shadow-sm">
                                <Image src={t.img} width={48} height={48} className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" alt={t.name} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-base font-bold text-gray-800 truncate">{t.name}</div>
                                    <div className="text-sm text-gray-500 truncate flex items-center gap-2 mt-0.5">
                                        <span className="font-medium bg-white px-2 py-0.5 rounded-md border border-gray-200">{t.position}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {totalScore > 0 && <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{totalScore}</span>}
                                    {isDone ? <div className="bg-emerald-100 p-1.5 rounded-full"><CheckCircle className="h-5 w-5 text-emerald-600" /></div> : <ChevronRight className="h-5 w-5 text-gray-300" />}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Desktop Preview - Scrollable Area */}
                <div className="hidden md:flex flex-col gap-2 mt-4 px-1 overflow-y-auto max-h-[260px] custom-scrollbar pr-2 -mr-2">
                    {targets.map((t) => {
                        const personCriteria = getCriteriaForUser(t);
                        const isDone = personCriteria.length > 0 && personCriteria.every(c => scores[t.internalId]?.[c.id]);
                        const totalScore = Math.round(calculateTotal(t.internalId, scores, personCriteria));

                        return (
                            <div key={t.internalId} onClick={() => navigateToIndividual(t)} className="flex items-center gap-3 text-base justify-between group hover:bg-slate-50 p-2 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-100 active:scale-[0.98]">
                                <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                                    <Image
                                        src={t.img}
                                        width={36}
                                        height={36}
                                        className="w-9 h-9 rounded-full border-2 border-white shadow-sm object-cover bg-gray-100 shrink-0"
                                        alt={t.name}
                                    />
                                    <div className="min-w-0">
                                        <div className={`font-bold truncate ${isDone ? 'text-emerald-700' : 'text-gray-700'}`}>{t.name}</div>
                                        <div className="text-sm text-muted-foreground truncate opacity-80">{t.position}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {totalScore > 0 && <span className="text-sm font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">{totalScore}</span>}
                                    {isDone && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                                </div>
                            </div>
                        );
                    })}
                    {targets.length > 4 && (
                        <div className="text-center py-2 sticky bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent pt-4">
                            <span className="text-xs text-gray-400 font-medium px-3 py-1 bg-gray-50 rounded-full flex items-center justify-center gap-1 mx-auto w-fit animate-pulse border border-gray-100">
                                <ChevronDown className="h-3 w-3" /> เลื่อนเพื่อดูเพิ่มเติม ({targets.length - 4})
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="hidden md:flex p-6 pt-2">
                <Button onClick={() => navigateToGroup(groupKey)} className="w-full h-12 rounded-xl text-base font-bold shadow-md bg-gradient-to-r from-indigo-600 to-primary hover:from-indigo-700 hover:to-indigo-800 transition-all active:scale-[0.98]">
                    ประเมินกลุ่ม <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
            </CardFooter>
        </Card>
    );
};
