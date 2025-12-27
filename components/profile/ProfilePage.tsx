"use client";

import React from 'react';
import { useAppContext } from '@/components/layout/AppProvider';
import { ROLE_LABELS } from '@/lib/constants';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const ProfilePage = () => {
    const { user, goBack } = useAppContext();

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4 animate-fade-in relative font-sans">
            {/* Decorative Background Elements */}
            <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-cyan-200/20 rounded-full blur-3xl pointer-events-none"></div>

            <Button onClick={goBack} variant="ghost" size="icon" className="absolute top-6 left-6 h-10 w-10 rounded-full bg-white/50 backdrop-blur-sm hover:bg-white border border-white/50 shadow-sm z-20"><ArrowLeft className="text-gray-600" /></Button>

            <Card className="w-full max-w-md text-center shadow-2xl shadow-indigo-100 bg-white/80 backdrop-blur-md border-white/50 rounded-3xl overflow-hidden relative z-10">
                <div className="h-32 bg-gradient-to-r from-indigo-500 to-cyan-500"></div>
                <CardHeader className="relative pt-0 pb-6 px-6 -mt-16">
                    <div className="relative inline-block mx-auto mb-4">
                        <Image src={user.img} width={100} height={100} className="w-28 h-28 rounded-full border-4 border-white shadow-lg bg-gray-100 object-cover" alt={user.name} />
                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full"></div>
                    </div>
                    <CardTitle className="text-2xl font-bold font-heading text-gray-800 tracking-tight">{user.name}</CardTitle>
                    <CardDescription className="text-gray-500 font-medium">{user.position}</CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <div className="text-left space-y-4 bg-gray-50/50 rounded-2xl p-6 border border-gray-100/50">
                        <div className="flex justify-between items-center group">
                            <span className="text-sm font-medium text-gray-400 group-hover:text-indigo-500 transition-colors">แผนก</span>
                            <span className="font-semibold text-gray-700">{user.dept}</span>
                        </div>
                        <Separator className="bg-gray-100" />
                        <div className="flex justify-between items-center group">
                            <span className="text-sm font-medium text-gray-400 group-hover:text-indigo-500 transition-colors">ตำแหน่ง</span>
                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100 px-3">{ROLE_LABELS[user.role]}</Badge>
                        </div>
                        <Separator className="bg-gray-100" />
                        <div className="flex justify-between items-center group">
                            <span className="text-sm font-medium text-gray-400 group-hover:text-indigo-500 transition-colors">รหัสพนักงาน</span>
                            <span className="font-mono text-sm font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md tracking-wider">{user.orgId}</span>
                        </div>
                        {user.isAdmin && (
                            <>
                                <Separator className="bg-gray-100" />
                                <div className="flex justify-between items-center group">
                                    <span className="text-sm font-medium text-gray-400 group-hover:text-indigo-500 transition-colors">สิทธิ์การใช้งาน</span>
                                    <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 border-0 shadow-sm px-3">Administrator</Badge>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfilePage;
