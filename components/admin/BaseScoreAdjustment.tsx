"use client";

import React, { useState } from 'react';
import { useAppContext } from '@/components/layout/AppProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';

const BaseScoreAdjustment = () => {
    const { deptAdjustment, setDeptAdjustment, updateSystemConfig, systemConfig, allUsers } = useAppContext();
    const [localAdjustment, setLocalAdjustment] = useState(deptAdjustment);
    const [editMode, setEditMode] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');
    const { toast } = useToast();

    // Get unique departments from users that might not be in the adjustment list yet
    const availableDepts = React.useMemo(() => {
        const depts = new Set(allUsers.map(u => u.dept));
        return Array.from(depts).filter(d => d && !localAdjustment[d]);
    }, [allUsers, localAdjustment]);

    const handleSave = async () => {
        try {
            await updateSystemConfig({ ...systemConfig, deptAdjustment: localAdjustment });
            setDeptAdjustment(localAdjustment);
            setEditMode(false);
            toast({ title: "บันทึกการปรับฐานแล้ว", description: "การปรับฐานคะแนนพื้นฐานได้รับการบันทึกลงฐานข้อมูลแล้ว" });
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "ไม่สามารถบันทึกข้อมูลได้" });
        }
    };

    const handleCancel = () => {
        setLocalAdjustment(deptAdjustment);
        setEditMode(false);
    };

    const handleAddDept = () => {
        if (!newDeptName) return;
        setLocalAdjustment({ ...localAdjustment, [newDeptName]: 1.0 });
        setNewDeptName('');
    };

    const handleRemoveDept = (dept: string) => {
        const newAdj = { ...localAdjustment };
        delete newAdj[dept];
        setLocalAdjustment(newAdj);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-heading">ปรับฐานคะแนน</h1>
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>ตัวคูณตามแผนกและบทบาท</CardTitle>
                            <CardDescription>กำหนดปัจจัยการปรับค่าปกติสำหรับกลุ่มต่างๆ (เช่น 0.90 สำหรับแผนกที่ให้คะแนนสูงเกินจริง)</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            {editMode ? (
                                <>
                                    <Button variant="outline" onClick={handleCancel}>ยกเลิก</Button>
                                    <Button onClick={handleSave}>บันทึกการเปลี่ยนแปลง</Button>
                                </>
                            ) : (
                                <Button onClick={() => setEditMode(true)}>แก้ไขตัวคูณ</Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {editMode && (
                        <div className="mb-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex gap-3 items-end">
                            <div className="flex-1 space-y-1.5">
                                <Label htmlFor="new-dept">เพิ่มแผนก</Label>
                                <Input
                                    id="new-dept"
                                    placeholder="ชื่อแผนก..."
                                    value={newDeptName}
                                    onChange={e => setNewDeptName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddDept()}
                                />
                            </div>
                            <Button onClick={handleAddDept} variant="secondary" className="gap-2">
                                <Plus className="w-4 h-4" /> เพิ่ม
                            </Button>
                        </div>
                    )}

                    <div className="space-y-1">
                        {Object.keys(localAdjustment).length > 0 ? Object.keys(localAdjustment).map((dept, index) => (
                            <div key={dept}>
                                <div className="flex justify-between items-center py-3 group">
                                    <div className="flex items-center gap-3">
                                        {editMode && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleRemoveDept(dept)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Label htmlFor={`adj-${dept}`} className="font-medium text-base">{dept}</Label>
                                    </div>

                                    {editMode ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id={`adj-${dept}`}
                                                type="number"
                                                step="0.01"
                                                value={localAdjustment[dept]}
                                                onChange={e => setLocalAdjustment({ ...localAdjustment, [dept]: parseFloat(e.target.value) || 0 })}
                                                className="w-24 text-right"
                                            />
                                            <span className="text-muted-foreground w-4 text-sm">x</span>
                                        </div>
                                    ) : (
                                        <p className="font-mono text-lg bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">{localAdjustment[dept]?.toFixed(2)}x</p>
                                    )}
                                </div>
                                {index < Object.keys(localAdjustment).length - 1 && <Separator className="bg-gray-100" />}
                            </div>
                        )) : (
                            <div className="text-center py-10 text-muted-foreground">ไม่พบข้อมูลการปรับฐานคะแนน</div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 text-amber-800">
                <div className="p-2 bg-amber-200 rounded-full h-fit">
                    <Plus className="w-4 h-4" />
                </div>
                <div className="text-sm">
                    <p className="font-bold mb-1">คำแนะนำการใช้งาน</p>
                    <p>หากพบว่าสายงานใดมีการให้คะแนนเฉลี่ยสูงกว่าปกติอย่างเห็นได้ชัด (เช่น เฉลี่ย 95%)
                        คุณสามารถกำหนดตัวคูณให้น้อยกว่า 1.0 (เช่น 0.90) เพื่อปรับลดฐานคะแนนของแผนกนั้นให้กลับมาอยู่ในระดับที่สมเหตุสมผลได้ครับ</p>
                </div>
            </div>
        </div>
    );
};

export default BaseScoreAdjustment;

