"use client";

import React, { useState } from 'react';
import { useAppContext } from '@/components/layout/AppProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { downloadCSV, generateInternalId, getAvatar } from '@/lib/helpers';
import { calculateSalaryGroup } from '@/lib/helpers';
import { UserFormDialog } from './UserFormDialog';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { FileDown, Plus, Search, Trash2, Edit2, Upload } from 'lucide-react';
import Image from 'next/image';
import * as XLSX from 'xlsx';
import type { User, Role } from '@/lib/types';



const AdminUserManagement = () => {
    const { allUsers, setAllUsers, addLog, saveUser, deleteUser, importUsers, refreshData } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<Partial<User> | null>(null);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const { toast } = useToast();

    const filteredUsers = allUsers.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleToggle = async (id: string, field: 'isAdmin' | 'canViewReport' | 'isActive') => {
        // Optimistic
        const originalUsers = [...allUsers];
        const updatedUsers = allUsers.map(u => u.internalId === id ? { ...u, [field]: !u[field] } : u);
        setAllUsers(updatedUsers);

        try {
            const user = updatedUsers.find(u => u.internalId === id);
            if (user) {
                const res = await saveUser(user);
                console.log('Toggle Permission Response:', res);
                addLog('ADMIN', `Toggled ${field} for user ID ${id}`);
            }
        } catch (e) {
            console.error('Toggle Permission Error:', e);
            setAllUsers(originalUsers); // Revert
            toast({ variant: 'destructive', title: "Update Failed", description: "Could not save changes." });
        }
    };

    const handleDeleteClick = (id: string) => {
        setUserToDelete(id);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (userToDelete) {
            try {
                await deleteUser(userToDelete);
                await refreshData();
                addLog('ADMIN', `Deleted user ID ${userToDelete}`);
                toast({ title: "ลบผู้ใช้แล้ว", description: "ผู้ใช้ถูกลบออกจากระบบอย่างถาวร" });
            } catch (e) {
                toast({ variant: 'destructive', title: "Delete Failed", description: "Could not delete user." });
            }
            setUserToDelete(null);
        }
        setIsConfirmOpen(false);
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls, .csv';
        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (evt: any) => {
                try {
                    const bstr = evt.target.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws);

                    const cleanName = (name: string) => {
                        return name.replace(/^(นาย|นาง|นางสาว|ดร\.|ผศ\.|รศ\.|ศ\.|ว่าที่ร้อยตรี|ว่าที่ร\.ต\.)\s*/g, '').trim();
                    };

                    // Map fields
                    const newUsers: User[] = data.map((row: any) => {
                        const salary = row["เงินเดือน"] ? Number(row["เงินเดือน"]) : 0;
                        const rawName = row["ชื่อ-นามสกุล"] || "";
                        const orgId = row["รหัสพนักงาน"] ? Number(row["รหัสพนักงาน"]) : 0;
                        const memberId = row["เลขสมาชิก"] ? String(row["เลขสมาชิก"]) : undefined;

                        // Generate rough ID if not present
                        return {
                            internalId: row["InternalID"] || generateInternalId(),
                            orgId: orgId,
                            memberId: memberId,
                            name: cleanName(rawName),
                            position: row["ตำแหน่ง"] || "",
                            dept: row["แผนก"] || "",
                            salary: salary,
                            salaryGroup: calculateSalaryGroup(salary),
                            role: (row["ระดับ(COMMITTEE/MANAGER/ASST/HEAD/STAFF)"] as Role) || "STAFF",
                            mobile: row["เบอร์โทรศัพท์"] ? String(row["เบอร์โทรศัพท์"]) : undefined,
                            email: row["อีเมล"] ? String(row["อีเมล"]) : undefined,
                            parentInternalId: null,
                            img: memberId
                                ? `https://apps2.coop.ku.ac.th/asset/staff/2568/crop/${memberId}.jpg`
                                : getAvatar(orgId),
                            isAdmin: false,
                            canViewReport: false,
                            isActive: true
                        } as User;
                    });

                    if (newUsers.length > 0) {
                        toast({ title: "กำลังนำเข้า...", description: `กำลังบันทึก ${newUsers.length} รายการ...` });
                        await importUsers(newUsers);
                        await refreshData();
                        toast({ title: "นำเข้าสำเร็จ", description: `นำเข้า ${newUsers.length} ผู้ใช้เรียบร้อยแล้ว` });
                        addLog('IMPORT', `Imported ${newUsers.length} users`);
                    } else {
                        toast({ variant: 'destructive', title: "ไม่พบข้อมูล", description: "ไฟล์ไม่มีข้อมูลที่ถูกต้อง" });
                    }

                } catch (error) {
                    console.error("Import Error", error);
                    toast({ variant: 'destructive', title: "นำเข้าล้มเหลว", description: "เกิดข้อผิดพลาดในการอ่านไฟล์" });
                }
            };
            reader.readAsBinaryString(file);
        };
        input.click();
    };

    const handleDownloadTemplate = () => {
        const headers = ["รหัสพนักงาน", "เลขสมาชิก", "ชื่อ-นามสกุล", "ตำแหน่ง", "แผนก", "เงินเดือน", "ระดับ(COMMITTEE/MANAGER/ASST/HEAD/STAFF)", "เบอร์โทรศัพท์", "อีเมล"];
        downloadCSV("user_import_template.csv", headers.join(","));
    };

    const handleExportUsers = () => {
        const headers = ["รหัสพนักงาน", "เลขสมาชิก", "ชื่อ-นามสกุล", "ตำแหน่ง", "แผนก", "เงินเดือน", "ระดับ", "เบอร์โทรศัพท์", "อีเมล", "InternalID"];
        const content = headers.join(',') + '\n' + allUsers.map(u =>
            `${u.orgId || ''},${u.memberId || ''},"${u.name}","${u.position}","${u.dept}",${u.salary},${u.role},${u.mobile || ''},${u.email || ''},${u.internalId}`
        ).join('\n');
        downloadCSV("users_export.csv", content);
        addLog('EXPORT', `Exported ${allUsers.length} users`);
        toast({ title: "ส่งออกสำเร็จ", description: `ส่งออกข้อมูลผู้ใช้ ${allUsers.length} รายการแล้ว` });
    };

    const handleSaveUser = async (userData: Partial<User>) => {
        try {
            let finalUser = { ...userData };

            // Recalculate salary group if salary changed
            if (userData.salary) {
                finalUser.salaryGroup = calculateSalaryGroup(userData.salary);
            }

            if (!userToEdit?.internalId) {
                // New user
                finalUser.internalId = generateInternalId();
                finalUser.img = getAvatar(userData.orgId as number);
                finalUser.isActive = true;
                finalUser.isAdmin = false;
                finalUser.canViewReport = false;
            } else {
                // Ensure internalId is present for update
                finalUser.internalId = userToEdit.internalId;
            }

            const res = await saveUser(finalUser);
            console.log('Save User Response:', res);
            await refreshData();

            addLog('ADMIN', `Saved user ${userData.name}`);
            toast({ title: "บันทึกสำเร็จ", description: `ข้อมูลของ ${userData.name} ถูกบันทึกแล้ว` });
        } catch (e) {
            console.error('Save User Error:', e);
            toast({ variant: 'destructive', title: "บันทึกล้มเหลว", description: "ไม่สามารถบันทึกข้อมูลได้" });
        }
        setIsModalOpen(false);
        setUserToEdit(null);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">จัดการผู้ใช้</h1>
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="relative w-full md:w-1/3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="ค้นหาตามชื่อหรือแผนก..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleDownloadTemplate}><FileDown className="mr-2 h-4 w-4" /> เทมเพลต</Button>
                            <Button variant="outline" onClick={handleImport}><Upload className="mr-2 h-4 w-4" /> นำเข้า</Button>
                            <Button variant="outline" onClick={handleExportUsers}><FileDown className="mr-2 h-4 w-4" /> ส่งออก</Button>
                            <Button onClick={() => { setUserToEdit(null); setIsModalOpen(true); }}><Plus className="mr-2 h-4 w-4" /> เพิ่มผู้ใช้</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[300px]">ผู้ใช้งาน</TableHead>
                                    <TableHead>รายละเอียด</TableHead>
                                    <TableHead>แอดมิน</TableHead>
                                    <TableHead>สิทธิ์รายงาน</TableHead>
                                    <TableHead className="text-right">จัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map(user => (
                                    <TableRow key={user.internalId} className={!user.isActive ? 'opacity-40' : ''}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Image src={user.img} width={40} height={40} className="w-10 h-10 rounded-full" alt={user.name} />
                                                <div>
                                                    <p className="font-bold">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">ID: {user.orgId} {user.memberId && <span>| MEM: {user.memberId}</span>}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p>{user.position} / {user.dept}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary">{user.role}</Badge>
                                            </div>
                                            <div className="flex flex-col gap-1 mt-1">
                                                {user.mobile && <p className="text-xs text-muted-foreground flex items-center gap-1"><span className="font-medium text-gray-500">Tel:</span> {user.mobile}</p>}
                                                {user.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><span className="font-medium text-gray-500">Mail:</span> {user.email}</p>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Switch checked={user.isAdmin} onCheckedChange={() => handleToggle(user.internalId, 'isAdmin')} aria-label="Toggle admin status" />
                                        </TableCell>
                                        <TableCell>
                                            <Switch checked={user.canViewReport} onCheckedChange={() => handleToggle(user.internalId, 'canViewReport')} aria-label="Toggle report access" />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => { setUserToEdit(user); setIsModalOpen(true); }}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(user.internalId)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <UserFormDialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveUser} user={userToEdit} />
            <ConfirmDialog
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                onConfirm={confirmDelete}
                title="คุณแน่ใจหรือไม่?"
                description="การกระทำนี้ไม่สามารถยกเลิกได้ จะเป็นการลบผู้ใช้และข้อมูลที่เกี่ยวข้องทั้งหมดอย่างถาวร"
            />
        </div>
    );
};

export default AdminUserManagement;
