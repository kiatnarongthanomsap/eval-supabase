import React, { useState } from 'react';
import { useAppContext } from '@/components/layout/AppProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileDown, Upload, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { downloadCSV } from '@/lib/helpers';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Criteria } from '@/lib/types';
import { ConfirmDialog } from '../shared/ConfirmDialog';

const AdminCriteriaManagement = () => {
    const { criteria, addLog, saveCriteria, deleteCriteria } = useAppContext();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [editingCriteria, setEditingCriteria] = useState<Partial<Criteria> | null>(null);
    const [criteriaToDelete, setCriteriaToDelete] = useState<string | null>(null);

    // Form state
    const [text, setText] = useState('');
    const [category, setCategory] = useState<'PERF' | 'CHAR' | 'EXEC' | 'CORE' | 'FUNC' | 'MGT'>('PERF');
    const [weight, setWeight] = useState(0);
    const [description, setDescription] = useState('');

    const handleEdit = (c: Criteria) => {
        setEditingCriteria(c);
        setText(c.text);
        setCategory(c.category);
        setWeight(c.weight);
        setDescription(c.description || '');
        setIsDialogOpen(true);
    };

    const handleAdd = () => {
        setEditingCriteria(null);
        setText('');
        setCategory('PERF');
        setWeight(10);
        setDescription('');
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!text || weight <= 0) {
            toast({ variant: 'destructive', title: "ข้อมูลไม่ครบถ้วน", description: "กรุณาระบุหัวข้อและน้ำหนักให้ถูกต้อง" });
            return;
        }

        const newCriteria: Criteria = {
            id: editingCriteria?.id || `c-${Date.now()}`,
            text,
            category,
            weight,
            description
        };

        await saveCriteria(newCriteria);
        addLog('ADMIN', `${editingCriteria ? 'Updated' : 'Added'} criteria: ${text}`);
        setIsDialogOpen(false);
    };

    const handleDeleteClick = (id: string) => {
        setCriteriaToDelete(id);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (criteriaToDelete) {
            await deleteCriteria(criteriaToDelete);
            addLog('ADMIN', `Deleted criteria ID ${criteriaToDelete}`);
            setCriteriaToDelete(null);
        }
        setIsConfirmOpen(false);
    };

    const handleImport = () => {
        toast({ title: 'จำลองการนำเข้า...' });
        setTimeout(() => {
            toast({ title: 'นำเข้าหลักเกณฑ์สำเร็จ', description: 'หลักเกณฑ์การประเมินได้รับการอัปเดตแล้ว' });
            addLog('IMPORT', 'Imported criteria from CSV');
        }, 1500);
    };

    const handleDownloadTemplate = () => {
        const headers = ["ลำดับ", "หัวข้อการประเมิน", "หมวดหมู่(CORE/FUNC/MGT)", "น้ำหนัก(%)"];
        const content = headers.join(',') + '\n' + criteria.map((c, i) => `${i + 1},"${c.text}",${c.category},${c.weight}`).join('\n');
        downloadCSV("criteria_template.csv", content);
    };

    const handleExportCriteria = () => {
        const headers = ["ID", "หัวข้อการประเมิน", "หมวดหมู่", "น้ำหนัก(%)", "คำอธิบาย"];
        const content = headers.join(',') + '\n' + criteria.map(c =>
            `${c.id},"${c.text}",${c.category},${c.weight},"${c.description || ''}"`
        ).join('\n');
        downloadCSV("criteria_export.csv", content);
        addLog('EXPORT', `Exported ${criteria.length} criteria`);
        toast({ title: "ส่งออกสำเร็จ", description: `ส่งออกหลักเกณฑ์ ${criteria.length} รายการแล้ว` });
    };

    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">จัดการหลักเกณฑ์การประเมิน</h1>
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col space-y-1">
                        <CardTitle>หลักเกณฑ์การประเมิน</CardTitle>

                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button variant="outline" onClick={handleDownloadTemplate}><FileDown className="mr-2 h-4 w-4" /> เทมเพลต</Button>
                        <Button variant="outline" onClick={handleImport}><Upload className="mr-2 h-4 w-4" /> นำเข้า</Button>
                        <Button variant="outline" onClick={handleExportCriteria}><FileDown className="mr-2 h-4 w-4" /> ส่งออก</Button>
                        <Button onClick={handleAdd}><Plus className="mr-2 h-4 w-4" /> เพิ่มหลักเกณฑ์</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {['PERF', 'CHAR', 'EXEC', 'CORE', 'FUNC', 'MGT'].map(catCode => {
                            const catCriteria = criteria.filter(c => c.category === catCode);
                            if (catCriteria.length === 0) return null;

                            const catName = {
                                'PERF': 'Performance (ผลงาน)',
                                'CHAR': 'Characteristics (คุณลักษณะ)',
                                'EXEC': 'Executive (ผู้บริหาร)',
                                'CORE': 'Core Competency',
                                'FUNC': 'Functional Competency',
                                'MGT': 'Managerial Competency'
                            }[catCode];

                            return (
                                <div key={catCode} className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-lg">{catName}</h3>
                                        <Badge variant="outline">รวม {catCriteria.reduce((sum, c) => sum + c.weight, 0)}%</Badge>
                                    </div>
                                    <ul className="space-y-2">
                                        {catCriteria.map((c, index) => (
                                            <li key={c.id}>
                                                <div className="flex items-center justify-between py-3 bg-white dark:bg-slate-800 p-3 rounded shadow-sm">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium">{c.text}</p>
                                                        </div>
                                                        {c.description && <p className="text-sm text-muted-foreground mt-1">{c.description}</p>}
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <p className="font-bold text-lg text-primary w-12 text-right">{c.weight}%</p>
                                                        <div className="flex gap-1">
                                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(c.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCriteria ? 'แก้ไขหลักเกณฑ์' : 'เพิ่มหลักเกณฑ์ใหม่'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">หมวดหมู่</Label>
                            <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="เลือกหมวดหมู่" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PERF">Performance (ผลงาน)</SelectItem>
                                    <SelectItem value="CHAR">Characteristics (คุณลักษณะ)</SelectItem>
                                    <SelectItem value="EXEC">Executive (ผู้บริหาร)</SelectItem>
                                    <SelectItem value="CORE">Core Competency</SelectItem>
                                    <SelectItem value="FUNC">Functional Competency</SelectItem>
                                    <SelectItem value="MGT">Managerial Competency</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="text" className="text-right">หัวข้อ</Label>
                            <Input id="text" value={text} onChange={(e) => setText(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="weight" className="text-right">น้ำหนัก (%)</Label>
                            <Input id="weight" type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">คำอธิบาย</Label>
                            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
                        <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> บันทึก</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                onConfirm={confirmDelete}
                title="ยืนยันการลบ"
                description="คุณต้องการลบหลักเกณฑ์นี้ใช่หรือไม่? การกระทำนี้ไม่สามารถเรียกคืนได้"
            />
        </div>
    );
};

export default AdminCriteriaManagement;
