"use client";

import React, { useState } from 'react';
import { useAppContext } from '@/components/layout/AppProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, User as UserIcon, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { User } from '@/lib/types';

const AdminOrgView = () => {
    const { allUsers } = useAppContext();
    const departments = Array.from(new Set(allUsers.map(u => u.dept))).sort();
    const [selectedDept, setSelectedDept] = useState<string | null>(null);

    const getDeptUsers = (dept: string) => allUsers.filter(u => u.dept === dept && u.isActive);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold font-heading">โครงสร้างองค์กร</h1>
                <p className="text-muted-foreground">ภาพรวมบุคลากรแยกตามแผนกและหน่วยงาน</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {departments.map(d => {
                    const users = getDeptUsers(d);
                    const count = users.length;
                    return (
                        <Card
                            key={d}
                            className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-primary hover:-translate-y-1"
                            onClick={() => setSelectedDept(d)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="bg-primary/10 p-3 rounded-full">
                                        <Building2 className="h-6 w-6 text-primary" />
                                    </div>
                                    <Badge variant="secondary" className="text-xs">{count} คน</Badge>
                                </div>
                                <CardTitle className="mt-4 text-xl">{d}</CardTitle>
                                <CardDescription>คลิกเพื่อดูรายชื่อ</CardDescription>
                            </CardHeader>
                        </Card>
                    )
                })}
            </div>

            <Dialog open={!!selectedDept} onOpenChange={(open) => !open && setSelectedDept(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            <Building2 className="h-6 w-6" /> {selectedDept}
                        </DialogTitle>
                        <DialogDescription>
                            รายชื่อบุคลากรทั้งหมดในแผนก {getDeptUsers(selectedDept || '').length} คน
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] pr-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            {selectedDept && getDeptUsers(selectedDept).map(u => (
                                <div key={u.internalId} className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                        <AvatarImage src={u.img} />
                                        <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold truncate">{u.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{u.position}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-[10px] h-4">{u.role}</Badge>
                                            {u.email && <span className="text-[10px] text-muted-foreground truncate">{u.email}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminOrgView;
