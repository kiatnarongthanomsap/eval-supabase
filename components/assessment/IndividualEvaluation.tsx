"use client";

import React, { useMemo } from 'react';
import { useAppContext } from '@/components/layout/AppProvider';
import { ArrowLeft, Save, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { getAiSuggestions } from '@/app/actions';
import { CRITERIA_CATEGORIES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const IndividualEvaluation = () => {
  const { currentPerson, goBack, scores, updateScore, getCriteriaForUser, comments, updateComment, systemConfig, user } = useAppContext();
  const { toast } = useToast();

  // Local state for scores to support "Save only if complete" logic
  const [localScores, setLocalScores] = React.useState<{ [key: string]: number }>({});
  const [isSaving, setIsSaving] = React.useState(false);
  const [isAiLoading, setIsAiLoading] = React.useState(false);

  // Initialize local scores from global scores on mount
  React.useEffect(() => {
    if (currentPerson && scores[currentPerson.internalId]) {
      setLocalScores(scores[currentPerson.internalId]);
    }
  }, [currentPerson, scores]);

  const personCriteria = useMemo(() => {
    if (!currentPerson) return [];
    return getCriteriaForUser(currentPerson);
  }, [currentPerson, getCriteriaForUser]);

  const categorizedCriteria = useMemo(() => {
    const grouped: { [key: string]: typeof personCriteria } = {};
    CRITERIA_CATEGORIES.forEach(cat => grouped[cat.id] = []);
    personCriteria.forEach(c => {
      const categoryKey = c.category as string;
      if (grouped[categoryKey]) grouped[categoryKey].push(c);
    });
    return grouped;
  }, [personCriteria]);

  const isOutOfTime = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return today < systemConfig.startDate || today > systemConfig.endDate;
  }, [systemConfig]);

  if (!currentPerson) return null;

  const handleSave = async () => {
    // Validation: Check if all criteria have been scored
    const missingCriteria = personCriteria.filter(c => !localScores[c.id]);

    if (missingCriteria.length > 0) {
      toast({
        title: "ประเมินไม่ครบถ้วน",
        description: `กรุณาให้คะแนนให้ครบทุกข้อ (ขาด ${missingCriteria.length} ข้อ)`,
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // Save all scores to server
      const promises = Object.entries(localScores).map(([criteriaId, score]) =>
        updateScore(currentPerson.internalId, criteriaId, score)
      );

      await Promise.all(promises);

      toast({ title: 'บันทึกการประเมินแล้ว', description: `การประเมินสำหรับ ${currentPerson.name} ถูกบันทึกแล้ว` });
      goBack();
    } catch (error) {
      toast({
        title: "บันทึกไม่สำเร็จ",
        description: "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getScoreButtonClass = (score: number, isSelected: boolean) => {
    if (isSelected) {
      const scale = 'scale-105 shadow-md';
      switch (score) {
        case 1: return `bg-red-500 hover:bg-red-500/90 text-white ${scale}`;
        case 2: return `bg-orange-400 hover:bg-orange-400/90 text-white ${scale}`;
        case 3: return `bg-yellow-500 hover:bg-yellow-500/90 text-white ${scale}`;
        case 4: return `bg-emerald-600 hover:bg-emerald-600/90 text-white ${scale}`;
      }
    }
    return 'bg-muted hover:bg-secondary';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex flex-col animate-fade-in font-sans">
      <header className="bg-white/80 backdrop-blur-md shadow-sm px-4 py-3 flex items-center gap-3 sticky top-0 z-20 border-b border-white/20 transition-all">
        <Button onClick={goBack} variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Image src={currentPerson.img} width={44} height={44} className="w-11 h-11 rounded-full border-2 border-white shadow-md bg-muted object-cover" alt={currentPerson.name} />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h2 className="font-bold font-headline text-lg text-gray-800 leading-tight">{currentPerson.name}</h2>
            <p className="text-sm text-gray-500 font-medium">{currentPerson.position}</p>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 space-y-5 max-w-2xl w-full mx-auto pb-32">
        {isOutOfTime && (
          <Card className="bg-yellow-50 border-yellow-200 text-yellow-800 shadow-sm rounded-2xl">
            <CardHeader className="flex-row items-center gap-3 space-y-0 p-4">
              <div className="p-2 bg-yellow-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-yellow-700" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">นอกช่วงเวลาการประเมิน</CardTitle>
                <CardDescription className="text-yellow-700 text-sm">ไม่สามารถแก้ไขหรือบันทึกข้อมูลได้</CardDescription>
              </div>
            </CardHeader>
          </Card>
        )}
        <TooltipProvider>
          {CRITERIA_CATEGORIES.map(cat => {
            const catCriteria = categorizedCriteria[cat.id];
            if (!catCriteria || catCriteria.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-4">
                <div className={cn("px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center gap-2 mb-2", cat.color)}>
                  <span className="w-2 h-2 rounded-full bg-current opacity-50"></span>
                  {cat.name}
                </div>
                {catCriteria.map((c, idx) => (
                  <Card key={c.id} className="shadow-lg shadow-indigo-100 border-0 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm animate-fade-in-up">
                    <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold mt-0.5">{personCriteria.indexOf(c) + 1}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <CardTitle className="text-base font-bold text-gray-800 cursor-help leading-snug">{c.text}</CardTitle>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs p-3 bg-gray-900 text-white border-0"><p>{c.description}</p></TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-sm font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-md">WT: {c.weight}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 px-4 pb-5">
                      <p className="text-sm text-gray-500 mb-4 px-1">{c.description}</p>
                      <div className="grid grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map(s => (
                          <Button
                            key={s}
                            onClick={() => setLocalScores(prev => ({ ...prev, [c.id]: s }))}
                            variant="outline"
                            disabled={isOutOfTime || isSaving}
                            className={cn(
                              'py-6 text-xl font-bold transition-all duration-200 h-14 rounded-2xl border-2',
                              getScoreButtonClass(s, localScores?.[c.id] === s)
                            )}
                          >
                            {s}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })}
        </TooltipProvider>

        <Card className="shadow-lg shadow-indigo-100 border-0 rounded-3xl overflow-hidden bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full"></span>
              ความคิดเห็นโดยรวม
            </CardTitle>
            {/* 
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (isAiLoading) return;
                setIsAiLoading(true);
                try {
                  const currentComments = typeof comments[currentPerson.internalId] === 'string'
                    ? comments[currentPerson.internalId]
                    : '';

                  const result = await getAiSuggestions({
                    position: currentPerson.position,
                    department: currentPerson.dept,
                    currentScores: localScores,
                    comments: currentComments
                  });

                  if (result.success) {
                    const suggestions = result.data;
                    // Update scores based on suggestions
                    setLocalScores(prev => {
                      const newScores = { ...prev };
                      Object.entries(suggestions).forEach(([key, adjustment]) => {
                        if (newScores[key]) {
                          // Simple logic: clamp between 1 and 4
                          newScores[key] = Math.max(1, Math.min(4, newScores[key] + Math.round(adjustment)));
                        }
                      });
                      return newScores;
                    });

                    toast({
                      title: "AI Suggestion Applied",
                      description: "ปรับคะแนนตามคำแนะนำของ AI เรียบร้อยแล้ว",
                      duration: 3000,
                    });
                  } else {
                    throw new Error(result.error);
                  }
                } catch (error: any) {
                  console.error("AI Error:", error);
                  toast({
                    title: "เกิดข้อผิดพลาด",
                    description: error.message || "ไม่สามารถขอคำแนะนำจาก AI ได้ในขณะนี้",
                    variant: "destructive"
                  });
                } finally {
                  setIsAiLoading(false);
                }
              }}
              className="ml-auto text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              disabled={isAiLoading || isOutOfTime}
            >
              {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              ขอคำแนะนำจาก AI
            </Button>
            */}
          </CardHeader>
          <CardContent className="p-4 pt-1">

            <Textarea
              className="min-h-[120px] text-base bg-gray-50 border-gray-100 rounded-2xl focus:ring-primary/20 focus:border-primary resize-none p-4"
              placeholder={`ระบุความคิดเห็นเพิ่มเติมสำหรับ ${currentPerson.name}...`}
              value={typeof comments[currentPerson.internalId] === 'string' ? comments[currentPerson.internalId] : ''}
              onChange={e => updateComment(currentPerson.internalId, e.target.value)}
              disabled={isOutOfTime}
            />
          </CardContent>
        </Card>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg p-4 border-t border-gray-100 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-40">
        <Button onClick={handleSave} size="lg" className="w-full max-w-2xl mx-auto flex gap-2 h-14 rounded-2xl text-lg font-bold shadow-xl shadow-indigo-200 bg-gradient-to-r from-primary to-indigo-600 hover:scale-[1.01] active:scale-[0.98] transition-all" disabled={isOutOfTime || isSaving}>
          {isSaving ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/80"></span> : <Save className="h-5 w-5" />} บันทึกการประเมิน
        </Button>
      </footer>
    </div>
  );
};

export default IndividualEvaluation;
