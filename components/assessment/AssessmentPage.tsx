"use client";

import React, { useMemo } from 'react';
import { useAppContext } from '@/components/layout/AppProvider';
import { findTargets, formatSalaryGroup } from '@/lib/helpers';
import { ROLES, ROLE_LABELS } from '@/lib/constants';
import type { Target, Role } from '@/lib/types';
import { CheckCircle, ChevronRight, FileText, LogOut, Settings, UserCircle, AlertTriangle, Footprints, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { AssessmentCard } from './AssessmentCard';
import { Mail, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AssessmentPage = () => {
  const { user, logout, navigateToGroup, scores, setView, navigateToIndividual, exclusions, allUsers, getCriteriaForUser, systemConfig, sendEvaluationEmail, comments } = useAppContext();
  const [isSendingEmail, setIsSendingEmail] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const isOutOfTime = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return today < systemConfig.startDate || today > systemConfig.endDate;
  }, [systemConfig]);

  const handleSendEmail = async () => {
    if (!user) return;
    setIsSendingEmail(true);
    try {
      const evaluationSummary = allTargets.map(target => {
        const targetScores = scores[target.internalId] || {};
        const targetCriteria = getCriteriaForUser(target);
        const totalScore = Object.values(targetScores).reduce((a, b) => a + Number(b), 0);
        const maxScore = targetCriteria.length * 4;
        const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

        let level = "N/A";
        if (percentage >= 90) level = "ดีเยี่ยม";
        else if (percentage >= 80) level = "ดีมาก";
        else if (percentage >= 70) level = "ดี";
        else if (percentage >= 60) level = "พอใช้";
        else if (percentage > 0) level = "ควรปรับปรุง";

        return {
          name: target.name,
          position: target.position,
          dept: target.dept,
          score: totalScore,
          maxScore: maxScore,
          level: level,
          comment: comments[target.internalId] || "-",
          details: targetCriteria.map(c => ({
            text: c.text,
            score: targetScores[c.id] || 0
          }))
        };
      });

      await sendEvaluationEmail({
        evaluatorName: user.name,
        evaluatorPosition: user.position,
        date: new Date().toLocaleDateString('th-TH'),
        summary: evaluationSummary
      });
    } catch (error) {
      console.error("Email Error:", error);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const allTargets = useMemo(() => {
    if (!user) return [];

    // Get all targets based on logic
    const targets = findTargets(user, allUsers, exclusions);

    // Explicitly filter out Committee members from being evaluated
    return targets.filter(t => t.role !== ROLES.COMMITTEE);
  }, [user, allUsers, exclusions]);

  const { groupedTargets, sortedGroupEntries } = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    // Always group by role (position)
    allTargets.forEach(t => {
      const key = t.role;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    // Determine Role Priority
    const rolePriority = {
      [ROLES.COMMITTEE]: 1,
      [ROLES.MANAGER]: 2,
      [ROLES.ASST]: 3,
      [ROLES.HEAD]: 4,
      [ROLES.STAFF]: 5,
    };

    // Sort users within each group
    Object.keys(groups).forEach(key => {
      groups[key].sort((a: any, b: any) => {
        const priorityA = rolePriority[a.role as Role] || 99;
        const priorityB = rolePriority[b.role as Role] || 99;

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        // Special sub-sort for ASST role: Prioritize "รองผู้จัดการ" over "ผู้ช่วย"
        if (a.role === ROLES.ASST && b.role === ROLES.ASST) {
          const isDeputyA = a.position.includes('รอง');
          const isDeputyB = b.position.includes('รอง');
          if (isDeputyA && !isDeputyB) return -1;
          if (!isDeputyA && isDeputyB) return 1;
        }

        return a.name.localeCompare(b.name, 'th');
      });
    });

    // Always sort by role order
    const sortedEntries = Object.entries(groups).sort(([keyA], [keyB]) => {
      const roleOrder = [ROLES.COMMITTEE, ROLES.MANAGER, ROLES.ASST, ROLES.HEAD, ROLES.STAFF];
      const indexA = roleOrder.indexOf(keyA as any);
      const indexB = roleOrder.indexOf(keyB as any);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    return { groupedTargets: groups, sortedGroupEntries: sortedEntries };
  }, [allTargets]);

  const { progressPercent, completedPeople } = useMemo(() => {
    let completed = 0;
    allTargets.forEach(person => {
      const personCriteria = getCriteriaForUser(person);
      if (personCriteria.length === 0) {
        // If no criteria, maybe they don't count or count as done? Assuming done if logic elsewhere acts that way.
        // But usually we skip them. Let's stick to "Must have criteria and all filled".
        return;
      }

      let personFilled = 0;
      if (scores[person.internalId]) {
        personCriteria.forEach(c => {
          if (scores[person.internalId][c.id]) personFilled++;
        })
      }

      if (personFilled === personCriteria.length && personCriteria.length > 0) {
        completed++;
      }
    });

    const totalPeople = allTargets.length;
    const progress = totalPeople > 0 ? Math.round((completed / totalPeople) * 100) : 0;
    return { progressPercent: progress, completedPeople: completed };
  }, [allTargets, scores, getCriteriaForUser]);

  if (!user) return null;

  const canViewReport = user.isAdmin || user.canViewReport;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 pb-20 animate-fade-in font-sans">
        {/* Modern Header with Glass Effect */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm px-6 py-5 flex justify-between items-center sticky top-0 z-30 border-b border-white/20 transition-all">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer transition-transform hover:scale-105" onClick={() => setView('profile')}>
              <div className="w-14 h-14 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                <Image src={user.img} width={56} height={56} alt={user.name} className="object-cover w-full h-full" />
              </div>
              <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold font-heading text-gray-800 tracking-tight flex items-center gap-2">
                สวัสดี, <span className="text-primary">{user.name}</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {user.position}
                </p>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">
                  รอบการประเมิน: {new Date(systemConfig.startDate).toLocaleDateString('th-TH')} - {new Date(systemConfig.endDate).toLocaleDateString('th-TH')}
                </p>
              </div>
            </div>
          </div>
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            {(user.isAdmin || user.canViewReport) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setView('admin')} className="h-10 w-10 rounded-full hover:bg-indigo-50 transition-all hover:scale-105 hover:shadow-md">
                    <Settings className="h-5 w-5 text-gray-600 hover:text-primary" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{user.isAdmin ? 'แผงควบคุมผู้ดูแล' : 'จัดการการปรับฐานคะแนน'}</p></TooltipContent>
              </Tooltip>
            )}
            {canViewReport && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setView('progress')} className="h-10 w-10 rounded-full hover:bg-purple-50 transition-all hover:scale-105 hover:shadow-md">
                      <Footprints className="h-5 w-5 text-gray-600 hover:text-purple-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>ความคืบหน้า</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setView('summary')} className="h-10 w-10 rounded-full hover:bg-emerald-50 transition-all hover:scale-105 hover:shadow-md">
                      <FileText className="h-5 w-5 text-gray-600 hover:text-emerald-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>รายงานสรุป</p></TooltipContent>
                </Tooltip>
              </>
            )}
            {systemConfig.sendEmailCopy && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full hover:bg-blue-50 transition-all hover:scale-105 hover:shadow-md"
                    onClick={handleSendEmail}
                    disabled={isSendingEmail}
                  >
                    {isSendingEmail ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> : <Mail className="h-5 w-5 text-gray-600 hover:text-blue-600" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>ส่งสำเนาเข้าเมลของฉัน</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setView('profile')} className="h-10 w-10 rounded-full hover:bg-blue-50 transition-all hover:scale-105 hover:shadow-md">
                  <UserCircle className="h-5 w-5 text-gray-600 hover:text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>โปรไฟล์</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={logout} className="h-10 w-10 rounded-full hover:bg-red-50 text-red-500 hover:text-red-600 transition-all hover:scale-105 hover:shadow-md">
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>ออกจากระบบ</p></TooltipContent>
            </Tooltip>
          </div>

          {/* Mobile Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 rounded-full hover:bg-gray-100">
                <Menu className="h-5 w-5 text-gray-600" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col gap-2 mt-6">
                {(user.isAdmin || user.canViewReport) && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setView('admin');
                      setIsMenuOpen(false);
                    }}
                    className="w-full justify-start gap-3 h-12 text-base"
                  >
                    <Settings className="h-5 w-5 text-indigo-600" />
                    <span>{user.isAdmin ? 'แผงควบคุมผู้ดูแล' : 'จัดการการปรับฐานคะแนน'}</span>
                  </Button>
                )}
                {canViewReport && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setView('progress');
                        setIsMenuOpen(false);
                      }}
                      className="w-full justify-start gap-3 h-12 text-base"
                    >
                      <Footprints className="h-5 w-5 text-purple-600" />
                      <span>ความคืบหน้า</span>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setView('summary');
                        setIsMenuOpen(false);
                      }}
                      className="w-full justify-start gap-3 h-12 text-base"
                    >
                      <FileText className="h-5 w-5 text-emerald-600" />
                      <span>รายงานสรุป</span>
                    </Button>
                  </>
                )}
                {systemConfig.sendEmailCopy && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      handleSendEmail();
                      setIsMenuOpen(false);
                    }}
                    disabled={isSendingEmail}
                    className="w-full justify-start gap-3 h-12 text-base"
                  >
                    {isSendingEmail ? (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    ) : (
                      <Mail className="h-5 w-5 text-blue-600" />
                    )}
                    <span>ส่งสำเนาเข้าเมลของฉัน</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setView('profile');
                    setIsMenuOpen(false);
                  }}
                  className="w-full justify-start gap-3 h-12 text-base"
                >
                  <UserCircle className="h-5 w-5 text-blue-600" />
                  <span>โปรไฟล์</span>
                </Button>
                <div className="border-t border-gray-200 my-2"></div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full justify-start gap-3 h-12 text-base text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />
                  <span>ออกจากระบบ</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-10">
          {isOutOfTime && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
              <div className="bg-amber-100 p-2 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-amber-900 font-bold text-base">อยู่นอกช่วงเวลาการประเมิน</h3>
                <p className="text-amber-700 text-sm">คุณสามารถเรียกดูข้อมูลย้อนหลังได้ แต่จะไม่สามารถแก้ไขคะแนนหรือความคิดเห็นได้ในขณะนี้</p>
              </div>
            </div>
          )}

          {/* Stats Card */}
          <Card className="bg-gradient-to-r from-indigo-600 to-primary text-white shadow-xl shadow-indigo-500/20 rounded-2xl overflow-hidden border-0 relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>
            <CardHeader className="pb-2 pt-4 relative z-10">
              <CardTitle className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-sm font-medium opacity-90">
                  <span className="bg-white/20 p-1.5 rounded-lg"><CheckCircle className="h-4 w-4" /></span>
                  สถานะการประเมินภาพรวม
                </span>
                <span className="text-2xl font-bold font-heading tracking-tight drop-shadow-sm">{progressPercent}%</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 pb-4">
              <Progress value={progressPercent} className="h-2.5 bg-black/20 rounded-full backdrop-blur-sm" indicatorClassName="bg-gradient-to-r from-emerald-300 to-emerald-400" />
              <div className="flex justify-between text-white/80 text-sm mt-2 font-medium">
                <span>ผู้ที่ต้องประเมินทั้งหมด <span className="text-white font-bold">{allTargets.length}</span> คน</span>
                <span>ประเมินเสร็จแล้ว <span className="text-white font-bold">{completedPeople}</span> คน</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl text-gray-800 font-bold font-heading flex items-center gap-3">
                <span className="w-1.5 h-8 bg-primary rounded-full"></span>
                รายการประเมินของคุณ
              </h2>
            </div>

            {allTargets.length === 0 ? (
              <div className="text-center py-20 bg-white/60 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 backdrop-blur-sm">
                <div className="mb-4 bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-gray-300">
                  <CheckCircle className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-semibold text-gray-500">ดีเยี่ยม! คุณไม่มีรายการที่ต้องประเมินแล้ว</h3>
                <p className="text-base mt-1 opacity-70">คุณได้ดำเนินการครบถ้วนสมบูรณ์</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {sortedGroupEntries.map(([key, targets]) => {
                  const groupLabel = ROLE_LABELS[key as Role] || key;

                  return (
                    <AssessmentCard
                      key={key}
                      targets={targets}
                      groupLabel={groupLabel}
                      groupKey={key}
                      scores={scores}
                      getCriteriaForUser={getCriteriaForUser}
                      navigateToIndividual={navigateToIndividual}
                      navigateToGroup={navigateToGroup}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default AssessmentPage;
