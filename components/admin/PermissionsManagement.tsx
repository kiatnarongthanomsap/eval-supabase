"use client";
import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/components/layout/AppProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const permissionLabels: Record<string, string> = {
    canManageUsers: 'จัดการผู้ใช้',
    canManageCriteria: 'จัดการหลักเกณฑ์',
    canManageAdjustments: 'ปรับฐานคะแนน',
    canUseAITool: 'ใช้เครื่องมือ AI',
    canManageSystem: 'ตั้งค่าระบบ',
    canViewReport: 'ดูรายงานสรุป',
};

const PermissionsManagement = () => {
    const { allUsers, setAllUsers, addLog } = useAppContext();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = useMemo(() => 
        allUsers.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
    , [allUsers, searchTerm]);

    const handleTogglePermission = (userId: string, permission: string) => {
        setAllUsers(prevUsers => 
            prevUsers.map(user => {
                if (user.internalId === userId) {
                    const newPermissions = {
                        ...user.permissions,
                        [permission]: !user.permissions?.[permission as keyof typeof user.permissions],
                    };
                    return { ...user, permissions: newPermissions };
                }
                return user;
            })
        );
        toast({ title: "อัปเดตสิทธิ์แล้ว" });
        addLog('PERMISSION', `Toggled permission ${permission} for user ${userId}`);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">จัดการสิทธิ์การเข้าถึง</h1>
            <Card>
                <CardHeader>
                    <CardTitle>กำหนดสิทธิ์ผู้ใช้</CardTitle>
                    <CardDescription>
                        เปิดหรือปิดการเข้าถึงส่วนต่างๆ ของแผงควบคุมสำหรับผู้ใช้แต่ละคน สิทธิ์ "Admin" จะมีผลเหนือกว่าการตั้งค่าทั้งหมด
                    </CardDescription>
                    <div className="relative pt-4">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="ค้นหาผู้ใช้..." 
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ผู้ใช้</TableHead>
                                    {Object.values(permissionLabels).map(label => (
                                        <TableHead key={label} className="text-center">{label}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map(user => (
                                    <TableRow key={user.internalId} className={user.isAdmin ? 'bg-primary/10' : ''}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Image src={user.img} width={40} height={40} className="w-10 h-10 rounded-full" alt={user.name}/>
                                                <div>
                                                    <p className="font-bold">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{user.position}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        {Object.keys(permissionLabels).map(permissionKey => (
                                            <TableCell key={permissionKey} className="text-center">
                                                <Switch
                                                    checked={user.isAdmin || (user.permissions?.[permissionKey as keyof typeof user.permissions] || false)}
                                                    onCheckedChange={() => handleTogglePermission(user.internalId, permissionKey)}
                                                    disabled={user.isAdmin}
                                                    aria-label={`Toggle ${permissionKey} for ${user.name}`}
                                                />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PermissionsManagement;
