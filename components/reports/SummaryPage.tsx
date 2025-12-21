"use client";

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/components/layout/AppProvider';
import { calculateTotal, getScoreLevel, formatSalaryGroup } from '@/lib/helpers';
import { ROLES, INITIAL_CRITERIA } from '@/lib/constants';
import { ArrowLeft, Download, ArrowUpDown, ArrowUp, ArrowDown, Search, FileSpreadsheet, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { downloadCSV } from '@/lib/helpers';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { User } from '@/lib/types';


type SortConfig = {
  key: keyof FormattedData | 'name' | 'salaryGroup' | 'finalScore';
  direction: 'ascending' | 'descending';
};

type CommentDetail = {
  evaluator: string;
  comment: string;
};

type FormattedData = {
  internalId: string;
  finalScore: number;
  levelLabel: string;
  levelColor: string;
  comment: string | CommentDetail[];
  isDone: boolean;
  name: string;
  position: string;
  dept: string;
  salaryGroup: string;
  img: string;
  email?: string;
};

const SummaryPage = () => {
  const { goBack, deptAdjustment, getCriteriaForUser, allUsers, fetchReportData, user } = useAppContext();
  const [useNormalization, setUseNormalization] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'finalScore', direction: 'descending' });
  const [selectedPerson, setSelectedPerson] = useState<FormattedData | null>(null);
  const [localScores, setLocalScores] = useState<any>({});
  const [localComments, setLocalComments] = useState<any>({});
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    // Fetch global data for report specifically, keeping main app state clean
    const load = async () => {
      setLoading(true);
      const data = await fetchReportData();
      if (data) {
        setLocalScores(data.scores || {});
        setLocalComments(data.comments || {});
      }
      setLoading(false);
    };
    load();
  }, []);

  const tableData: FormattedData[] = useMemo(() => {
    return allUsers
      .filter(e => e.role !== ROLES.COMMITTEE && e.isActive)
      .map(target => {
        const personCriteria = getCriteriaForUser(target);
        const rawTotal = calculateTotal(target.internalId, localScores, personCriteria);
        const factor = deptAdjustment[target.dept] || 1.0;
        const finalScore = useNormalization ? Math.min(100, rawTotal * factor) : rawTotal;
        const levelInfo = getScoreLevel(finalScore);
        const comment = localComments[target.internalId] || '-';
        const isDone = personCriteria.length > 0 && personCriteria.every(c => localScores[target.internalId]?.[c.id]);

        // Hide Self-Comments Logic
        const isSelf = user?.internalId === target.internalId;
        const displayComment = isSelf ? 'HIDDEN_SELF' : comment; // Use special flag

        return { ...target, finalScore, levelLabel: levelInfo.label, levelColor: levelInfo.color, comment: displayComment, isDone };
      });
  }, [allUsers, localScores, useNormalization, deptAdjustment, getCriteriaForUser, localComments]);

  // Dept Diagnostics
  const deptAverages = useMemo(() => {
    const totals: { [dept: string]: { sum: number; count: number } } = {};
    allUsers.forEach(u => {
      if (u.role === ROLES.COMMITTEE || !u.isActive) return;
      const personCriteria = getCriteriaForUser(u);
      const rawTotal = calculateTotal(u.internalId, localScores, personCriteria);
      if (!totals[u.dept]) totals[u.dept] = { sum: 0, count: 0 };
      totals[u.dept].sum += rawTotal;
      totals[u.dept].count += 1;
    });

    const averages: { [dept: string]: number } = {};
    Object.keys(totals).forEach(d => {
      averages[d] = totals[d].sum / totals[d].count;
    });
    return averages;
  }, [allUsers, localScores, getCriteriaForUser]);

  const sortedData = useMemo(() => {
    let filtered = tableData.filter(u => u.name.toLowerCase().includes(filterName.toLowerCase()));

    if (sortConfig.key !== null) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'ascending' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [tableData, filterName, sortConfig]);

  const handleSort = (key: SortConfig['key']) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: SortConfig['key'] }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50 inline" />;
    return sortConfig.direction === 'ascending' ?
      <ArrowUp className="ml-2 h-4 w-4 text-foreground inline" /> :
      <ArrowDown className="ml-2 h-4 w-4 text-foreground inline" />;
  };

  const handleExport = () => {
    const header = "ชื่อ-นามสกุล,อีเมล,ตำแหน่ง,แผนก,กลุ่มเงินเดือน,คะแนนรวม (%),ระดับ,ความเห็น\n";
    const rows = sortedData.map(d => {
      let commentStr = "";
      if (d.comment === 'HIDDEN_SELF') {
        commentStr = "สงวนสิทธิ์การเข้าถึง (Self-Evaluation Policy)";
      } else if (Array.isArray(d.comment)) {
        commentStr = d.comment.map(c => `[${c.evaluator}]: ${c.comment}`).join(" | ");
      } else {
        commentStr = d.comment;
      }

      const comment = `"${commentStr.replace(/"/g, '""')}"`;
      return [d.name, d.email || '', d.position, d.dept, d.salaryGroup, d.finalScore.toFixed(2), d.levelLabel, comment].join(",");
    }).join("\n");
    downloadCSV(`evaluation_summary_${new Date().toISOString().slice(0, 10)}.csv`, header + rows);
  };

  const handleDetailedExport = () => {
    // 1. Prepare Headers
    const staticHeaders = ["ชื่อ-นามสกุล", "อีเมล", "ตำแหน่ง", "แผนก", "กลุ่มเงินเดือน", "คะแนนรวม (%)", "ระดับ", "ความเห็น"];
    const criteriaHeaders = INITIAL_CRITERIA.map(c => `${c.id} ${c.text}`);
    const headerRow = [...staticHeaders, ...criteriaHeaders].join(",") + "\n";

    // 2. Prepare Rows
    const rows = sortedData.map(d => {
      const staticData = [
        d.name,
        d.email || '',
        d.position,
        d.dept,
        d.salaryGroup,
        d.finalScore.toFixed(2),
        d.levelLabel,
      ];

      const criteriaData = INITIAL_CRITERIA.map(c => {
        const score = localScores[d.internalId]?.[c.id];
        return score ? score : "";
      });

      // Handle comment export (join multiple if array)
      let commentStr = "";
      if (d.comment === 'HIDDEN_SELF') {
        commentStr = "สงวนสิทธิ์การเข้าถึง (Self-Evaluation Policy)";
      } else if (Array.isArray(d.comment)) {
        commentStr = d.comment.map((c: any) => `[${c.evaluator}]: ${c.comment}`).join("\n");
      } else {
        commentStr = d.comment as string;
      }
      const finalComment = `"${commentStr.replace(/"/g, '""')}"`;

      return [...staticData, ...criteriaData, finalComment].join(",");
    }).join("\n");

    downloadCSV(`evaluation_detailed_${new Date().toISOString().slice(0, 10)}.csv`, headerRow + rows);
  };

  const handleRowClick = (person: FormattedData) => {
    setSelectedPerson(person);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex flex-col animate-fade-in font-sans">
      <header className="bg-white/80 backdrop-blur-md shadow-sm px-6 py-4 flex items-center gap-4 sticky top-0 z-20 border-b border-white/20 transition-all">
        <Button onClick={goBack} variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-100"><ArrowLeft className="h-5 w-5 text-gray-600" /></Button>
        <h1 className="text-xl font-bold font-headline text-gray-800 tracking-tight flex items-center gap-2">
          <span className="bg-primary/10 text-primary p-2 rounded-xl"><FileSpreadsheet className="w-5 h-5" /></span>
          รายงานสรุปผลการประเมิน
        </h1>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center space-x-2 bg-white/50 px-3 py-1.5 rounded-full border border-gray-200">
            <Switch id="normalization-switch" checked={useNormalization} onCheckedChange={setUseNormalization} />
            <Label htmlFor="normalization-switch" className="text-sm cursor-pointer">ปรับฐานคะแนน</Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDetailedExport} variant="outline" className="rounded-xl h-10 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"><FileSpreadsheet className="mr-2 h-4 w-4" /> ส่งออกละเอียด</Button>
            <Button onClick={handleExport} className="rounded-xl h-10 shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700"><Download className="mr-2 h-4 w-4" /> ส่งออกเป็น CSV</Button>
          </div>
        </div>
      </header>
      <main className="p-4 md:p-6 flex-1">
        <Card className="bg-white/60 backdrop-blur-sm shadow-xl shadow-indigo-100 border border-white rounded-3xl overflow-hidden ring-1 ring-gray-950/5">
          <CardHeader className="border-b border-gray-100 bg-white/50 pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">ผลการประเมินทั้งหมด</CardTitle>
                <CardDescription className="text-gray-500 mt-1">สรุปผลการประเมินของพนักงานทั้งหมด (ไม่รวมคณะกรรมการ)</CardDescription>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ค้นหาตามชื่อ..."
                  className="pl-10 h-11 rounded-xl bg-white border-gray-200 focus:border-indigo-300 focus:ring-indigo-100"
                  value={filterName}
                  onChange={e => setFilterName(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/80">
                  <TableRow className="border-b border-gray-200 hover:bg-transparent">
                    <TableHead onClick={() => handleSort('dept')} className="cursor-pointer hover:bg-gray-50 transition-colors py-4">
                      แผนก <SortIcon column="dept" />
                    </TableHead>
                    <TableHead onClick={() => handleSort('salaryGroup')} className="cursor-pointer hover:bg-gray-100/80 h-12 font-semibold text-gray-600 transition-colors">กลุ่มเงินเดือน <SortIcon column="salaryGroup" /></TableHead>
                    <TableHead onClick={() => handleSort('finalScore')} className="cursor-pointer hover:bg-gray-100/80 h-12 text-center font-semibold text-gray-600 transition-colors">คะแนนรวม <SortIcon column="finalScore" /></TableHead>
                    <TableHead className="text-center font-semibold text-gray-600 h-12">ระดับ</TableHead>
                    <TableHead className="font-semibold text-gray-600 h-12">ความคิดเห็น</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((e) => (
                    <TableRow key={e.internalId} className="cursor-pointer hover:bg-indigo-50/40 transition-all border-b border-gray-50 last:border-0 group" onClick={() => handleRowClick(e)}>
                      <TableCell className="pl-6 py-3">
                        <div className="flex items-center gap-3">
                          <Image src={e.img} width={44} height={44} className="w-11 h-11 rounded-full border-2 border-white shadow-sm bg-gray-100 object-cover" alt={e.name} />
                          <div>
                            <p className="font-bold text-gray-800 group-hover:text-primary transition-colors">{e.name}</p>
                            <p className="text-xs text-gray-500">{e.position} <span className="text-gray-300 mx-1">|</span> {e.dept}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 font-medium text-sm">{formatSalaryGroup(e.salaryGroup)}</TableCell>
                      <TableCell className="text-center">
                        {e.isDone ? <span className="inline-block font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-lg min-w-[4rem]">{e.finalScore.toFixed(2)}%</span> : <span className="text-gray-300">-</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {e.isDone ? <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${e.levelColor} shadow-sm`}>{e.levelLabel}</span> : <span className="text-gray-300">-</span>}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-xs truncate opacity-70 group-hover:opacity-100 transition-opacity">
                        <div className="text-xs text-gray-500 max-w-[200px] truncate" title="คลิกเพื่อดูรายละเอียด">
                          {e.comment === 'HIDDEN_SELF' ?
                            <span className="text-gray-400 italic flex items-center gap-1"><Shield className="w-3 h-3" /> สงวนสิทธิ์การเข้าถึง</span>
                            : (Array.isArray(e.comment) ? e.comment.length + " ความเห็น" : e.comment)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Detail Dialog */}
      <Dialog open={!!selectedPerson} onOpenChange={(open) => !open && setSelectedPerson(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              {selectedPerson && (
                <>
                  <Image src={selectedPerson.img} width={64} height={64} className="w-16 h-16 rounded-full" alt={selectedPerson.name} />
                  <div>
                    <div className="text-2xl font-bold">{selectedPerson.name}</div>
                    <div className="text-sm font-normal text-muted-foreground">{selectedPerson.position} - {selectedPerson.dept}</div>
                  </div>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              รายละเอียดผลการประเมินรายบุคคล
            </DialogDescription>
          </DialogHeader>

          {selectedPerson && (() => {
            // Re-calculate details specifically for this render
            const criteria = getCriteriaForUser(selectedPerson as unknown as User); // Note: selectedPerson has internalId and other User props

            // We need to cast FormattedData back to User-like or just rely on internalId matching
            // Actually getCriteriaForUser needs a User object. FormattedData has all User fields (spread in useMemo).
            // Let's safe cast or ensure type compatibility.

            return (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">คะแนนรวม</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{selectedPerson.finalScore.toFixed(2)}%</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">ระดับ</CardTitle></CardHeader>
                    <CardContent>
                      <span className={`px-2 py-1 text-sm font-medium rounded-md border ${selectedPerson.levelColor}`}>
                        {selectedPerson.levelLabel}
                      </span>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">สถานะ</CardTitle></CardHeader>
                    <CardContent><div className="text-lg">{selectedPerson.isDone ? 'ประเมินแล้ว' : 'ยังไม่ครบ'}</div></CardContent>
                  </Card>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead>หัวข้อการประเมิน</TableHead>
                        <TableHead className="w-[100px] text-center">น้ำหนัก</TableHead>
                        <TableHead className="w-[100px] text-center">คะแนน (1-4)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {criteria.map(c => (
                        <TableRow key={c.id}>
                          <TableCell>
                            <div className="font-medium">{c.text}</div>
                            <div className="text-xs text-muted-foreground">{c.description}</div>
                          </TableCell>
                          <TableCell className="text-center">{c.weight}</TableCell>
                          <TableCell className="text-center font-bold">
                            {localScores[selectedPerson.internalId]?.[c.id] || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Comments Section */}
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">ความคิดเห็นเพิ่มเติม</h3>
                  {(() => {
                    if (selectedPerson?.comment === 'HIDDEN_SELF') {
                      return (
                        <div className="p-8 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
                          <div className="bg-gray-200 p-3 rounded-full mb-3">
                            <Shield className="w-8 h-8 text-gray-400" />
                          </div>
                          <h4 className="text-gray-600 font-bold">สงวนสิทธิ์การเข้าถึง</h4>
                          <p className="text-sm text-gray-500 mt-1">คุณไม่สามารถดูความคิดเห็นที่ผู้อื่นประเมินถึงคุณได้ตามนโยบายความเป็นส่วนตัว</p>
                        </div>
                      );
                    }

                    const comment = localComments[selectedPerson?.internalId || ''] || '-';
                    if (Array.isArray(comment)) {
                      return (
                        <div className="space-y-4">
                          {comment.map((c: any, idx: number) => (
                            <div key={idx} className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-700">
                                  {c.evaluator.charAt(0)}
                                </div>
                                <span className="text-xs font-bold text-gray-700">{c.evaluator}</span>
                              </div>
                              <p className="text-gray-600 pl-7">{c.comment}</p>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return <p className="text-gray-600 p-4 bg-muted/50 rounded-lg italic text-muted-foreground border">{comment}</p>;
                  })()
                  }
                </div>
              </div>
            );
          })()}

          <DialogFooter>
            <Button onClick={() => setSelectedPerson(null)}>ปิด</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SummaryPage;
