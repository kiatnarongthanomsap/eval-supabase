"use client";

import React, { useMemo } from 'react';
import { useAppContext } from '@/components/layout/AppProvider';
import { findTargets, calculateTotal } from '@/lib/helpers';
import { CRITERIA_CATEGORIES, ROLE_LABELS } from '@/lib/constants';
import { ArrowLeft, Save, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';

const EvaluationTable = () => {
  const { user, currentGroup, goBack, scores, updateScore, setScores, getCriteriaForUser, exclusions, allUsers, comments, updateComment, systemConfig } = useAppContext();
  const { toast } = useToast();

  const isOutOfTime = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return today < systemConfig.startDate || today > systemConfig.endDate;
  }, [systemConfig]);

  const people = useMemo(() => {
    if (!user || !currentGroup) return [];
    const allTargets = findTargets(user, allUsers, exclusions);
    // Always filter by role (position)
    return allTargets.filter(t => t.role === currentGroup);
  }, [user, currentGroup, allUsers, exclusions]);

  const groupCriteria = useMemo(() => {
    if (people.length === 0) return [];
    // Assume all people in the group have the same criteria
    return getCriteriaForUser(people[0]);
  }, [people, getCriteriaForUser]);

  const categorizedCriteria = useMemo(() => {
    const grouped: { [key: string]: typeof groupCriteria } = {};
    CRITERIA_CATEGORIES.forEach(cat => grouped[cat.id] = []);
    groupCriteria.forEach(c => {
      const categoryKey = c.category as string;
      if (grouped[categoryKey]) grouped[categoryKey].push(c);
    });
    return grouped;
  }, [groupCriteria]);

  const getScoreButtonClass = (score: number, isSelected: boolean) => {
    if (isSelected) {
      const scale = 'scale-110 shadow-lg';
      switch (score) {
        case 1: return `bg-red-500 hover:bg-red-500/90 text-white border-2 border-red-600 ${scale}`;
        case 2: return `bg-orange-400 hover:bg-orange-400/90 text-white border-2 border-orange-500 ${scale}`;
        case 3: return `bg-yellow-500 hover:bg-yellow-500/90 text-white border-2 border-yellow-600 ${scale}`;
        case 4: return `bg-emerald-600 hover:bg-emerald-600/90 text-white border-2 border-emerald-700 ${scale}`;
      }
    }
    return 'bg-muted hover:bg-secondary text-muted-foreground border-2 border-transparent';
  };

  const handleDefaultScores = async (targetScore: number = 3) => {
    if (isOutOfTime) {
      toast({ variant: 'destructive', title: 'ไม่อนุญาต', description: 'อยู่นอกช่วงเวลาการประเมิน' });
      return;
    }

    let updatedCount = 0;

    // We strictly use sequential await to ensure we don't overwhelm the browser/server with parallel requests
    // in a real app, a bulk update API endpoint is better.
    for (const person of people) {
      const criteria = getCriteriaForUser(person); // Use person-specific criteria in loop to be safe
      for (const c of criteria) {
        const currentScore = scores[person.internalId]?.[c.id];
        if (!currentScore) {
          // Call the context function which handles API and Optimistic update
          await updateScore(person.internalId, c.id, targetScore);
          updatedCount++;
        }
      }
    }

    if (updatedCount > 0) {
      toast({ title: "บันทึกสำเร็จ", description: `ใส่คะแนน ${targetScore} ให้กับ ${updatedCount} ช่องที่ว่างแล้ว` });
    } else {
      toast({ title: "ไม่มีการเปลี่ยนแปลง", description: "ทุกช่องมีคะแนนอยู่แล้ว" });
    }
  };

  const handleSave = () => {
    if (isOutOfTime) {
      toast({ variant: 'destructive', title: 'บันทึกไม่ได้', description: 'อยู่นอกช่วงเวลาการประเมิน' });
      return;
    }
    toast({ title: 'บันทึกสำเร็จ', description: 'ข้อมูลล่าสุดถูกต้องแล้ว (บันทึกอัตโนมัติ)' });
    goBack();
  };

  if (!currentGroup || people.length === 0) return null;

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex-col hidden md:flex animate-fade-in font-sans">
      <header className="bg-white/80 backdrop-blur-md shadow-sm px-6 py-4 flex items-center gap-4 flex-shrink-0 sticky top-0 z-30 border-b border-white/20 transition-all">
        <Button onClick={goBack} variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-100"><ArrowLeft className="h-5 w-5 text-gray-600" /></Button>
        <div>
          <h2 className="text-xl font-bold font-headline text-gray-800 tracking-tight flex items-center gap-2">
            กำลังประเมินระดับ: <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md">{ROLE_LABELS[currentGroup as keyof typeof ROLE_LABELS] || currentGroup}</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">ประเภท: {people[0]?.type}</p>
        </div>
        <div className="ml-auto flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isOutOfTime} className="rounded-xl h-10 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 gap-2">
                ใส่คะแนนอัตโนมัติ (ช่องว่าง) <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl shadow-xl shadow-indigo-100 border-indigo-100 bg-white/90 backdrop-blur-sm p-1">
              <DropdownMenuItem onClick={() => handleDefaultScores(4)} className="rounded-lg cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 font-medium">
                ใส่ 4 คะแนน (ดีมาก)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDefaultScores(3)} className="rounded-lg cursor-pointer hover:bg-blue-50 hover:text-blue-700 font-medium">
                ใส่ 3 คะแนน (ดี)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDefaultScores(2)} className="rounded-lg cursor-pointer hover:bg-orange-50 hover:text-orange-700 font-medium">
                ใส่ 2 คะแนน (พอใช้)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDefaultScores(1)} className="rounded-lg cursor-pointer hover:bg-red-50 hover:text-red-700 font-medium">
                ใส่ 1 คะแนน (ปรับปรุง)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleSave} className="gap-2 rounded-xl h-10 shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700" disabled={isOutOfTime}><Save className="h-4 w-4" /> เสร็จสิ้น</Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-4 md:p-6">
        <TooltipProvider>
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl shadow-indigo-100 border border-white h-full overflow-hidden ring-1 ring-gray-950/5 flex flex-col">
            <div className="overflow-auto flex-1 custom-scrollbar relative">
              <table className="w-full border-separate border-spacing-0 min-w-[1200px]">
                <thead>
                  <tr className="shadow-sm">
                    <th className="p-6 text-left sticky top-0 left-0 bg-gray-50/95 backdrop-blur-md z-[100] border-r border-b border-gray-200 w-[320px] min-w-[320px] shadow-[4px_0_8px_-2px_rgba(0,0,0,0.05)] h-[120px] align-middle">
                      <span className="text-base font-bold text-gray-800">หัวข้อการประเมิน</span>
                    </th>
                    {people.map(person => (
                      <th key={person.internalId} className="p-4 min-w-[200px] text-center align-top h-[120px] border-r border-b border-gray-200 sticky top-0 bg-gray-50/95 backdrop-blur-md z-[90]">
                        <div className="flex flex-col items-center gap-2">
                          <div className="relative">
                            <Image src={person.img} width={56} height={56} alt={person.name} className="w-14 h-14 rounded-full border-4 border-white shadow-md object-cover bg-gray-100" />
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                              <span className="flex h-4 w-4 rounded-full bg-emerald-500 border-2 border-white"></span>
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <p className="font-bold text-gray-800 text-sm truncate max-w-[160px]">{person.name}</p>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[150px] cursor-help mt-1">
                                  {user?.dept !== person.dept ? `${person.position} - ${person.dept}` : person.position}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent><p>{person.position} - {person.dept}</p></TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CRITERIA_CATEGORIES.map(cat => {
                    const catCriteria = categorizedCriteria[cat.id];
                    if (!catCriteria?.length) return null;
                    return (
                      <React.Fragment key={cat.id}>
                        <tr className="bg-gray-50/50">
                          <td colSpan={people.length + 1} className={cn("px-6 py-3 text-xs font-bold uppercase tracking-wider sticky left-0 z-[40] border-r border-b border-gray-200 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.05)]", cat.color.replace('bg-', 'bg-opacity-10 text-').replace('-100', '-700'))}>
                            <div className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", cat.color.replace('bg-', 'bg-'))}></span>
                              {cat.name}
                            </div>
                          </td>
                        </tr>
                        {catCriteria.map(c => (
                          <tr key={c.id} className="group hover:bg-indigo-100 transition-colors">
                            <td className="p-6 text-sm font-medium sticky left-0 bg-white border-r border-b border-gray-100 z-[20] w-[320px] min-w-[320px] shadow-[4px_0_8px_-2px_rgba(0,0,0,0.05)]">
                              <div className="flex justify-between items-start gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help text-gray-700 group-hover:text-indigo-600 transition-colors leading-relaxed block">{c.text}</span>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-md p-4 text-sm bg-gray-900 text-white border-0 shadow-xl"><p>{c.description}</p></TooltipContent>
                                </Tooltip>
                                <Badge variant="secondary" className="ml-1 shrink-0 bg-gray-100 text-gray-500 font-mono text-[10px]">x{c.weight}</Badge>
                              </div>
                            </td>
                            {people.map(person => (
                              <td key={`${person.internalId}-${c.id}`} className="p-3 text-center align-middle border-r border-b border-gray-100">
                                <div className="flex justify-center gap-1">
                                  {[1, 2, 3, 4].map(score => (
                                    <Button
                                      key={score}
                                      onClick={() => updateScore(person.internalId, c.id, score)}
                                      variant="ghost"
                                      size="icon"
                                      className={cn(
                                        "w-10 h-10 text-sm font-bold rounded-xl transition-all duration-200 border border-transparent",
                                        getScoreButtonClass(score, scores[person.internalId]?.[c.id] === score)
                                      )}
                                    >
                                      {score}
                                    </Button>
                                  ))}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  {/* Total Score Row */}
                  <tr className="bg-gray-50 font-bold">
                    <td className="p-6 text-sm sticky left-0 bg-gray-50 border-r border-b border-gray-200 z-[20] w-[320px] min-w-[320px] shadow-[4px_0_8px_-2px_rgba(0,0,0,0.05)]">
                      <span className="text-gray-800">คะแนนรวม (ปรับตามน้ำหนัก)</span>
                    </td>
                    {people.map(person => (
                      <td key={`total-${person.internalId}`} className="p-4 text-center border-r border-b border-gray-200">
                        <span className="text-xl text-primary">{calculateTotal(person.internalId, scores, groupCriteria).toFixed(2)}%</span>
                      </td>
                    ))}
                  </tr>
                  {/* Comment Row */}
                  <tr className="bg-white">
                    <td className="p-6 text-sm font-medium sticky left-0 bg-white border-r border-b border-gray-200 z-[20] w-[320px] min-w-[320px] shadow-[4px_0_8px_-2px_rgba(0,0,0,0.05)] align-top pt-8">
                      <span className="text-gray-700">ความคิดเห็นผู้ประเมิน</span>
                    </td>
                    {people.map(person => (
                      <td key={`comment-${person.internalId}`} className="p-4 align-top border-r border-b border-gray-200">
                        <Textarea
                          placeholder={`ความคิดเห็นสำหรับ ${person.name}...`}
                          className="min-h-[100px] text-sm bg-gray-50/50 border-gray-200 rounded-xl focus:ring-primary/20 focus:border-primary resize-none placeholder:text-gray-400 font-sans"
                          value={typeof comments[person.internalId] === 'string' ? comments[person.internalId] : ''}
                          onChange={(e) => updateComment(person.internalId, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </TooltipProvider>
      </main>
    </div>
  );
};

export default EvaluationTable;
