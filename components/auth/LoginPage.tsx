"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/components/layout/AppProvider';
import { ChevronRight, Code, Network, Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { APP_VERSION, ROLES, IS_DEBUG, API_BASE_URL } from '@/lib/constants';
import { formatSalaryGroup } from '@/lib/helpers';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

const LoginPage = () => {
  const { login, allUsers, isLoading } = useAppContext();
  const [isDevMode, setIsDevMode] = useState(IS_DEBUG);

  const [mobileNumber, setMobileNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const [selectedDept, setSelectedDept] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const { toast } = useToast();

  const departments = useMemo(() => Array.from(new Set(allUsers.map(u => u.dept))).sort(), [allUsers]);
  const usersInDept = useMemo(() => {
    const rolePriority = [ROLES.COMMITTEE, ROLES.MANAGER, ROLES.ASST, ROLES.HEAD, ROLES.STAFF];
    return allUsers
      .filter(u => u.dept === selectedDept && u.isActive)
      .sort((a, b) => {
        const priorityA = rolePriority.indexOf(a.role);
        const priorityB = rolePriority.indexOf(b.role);

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        return a.name.localeCompare(b.name, 'th');
      });
  }, [selectedDept, allUsers]);

  useEffect(() => {
    if (departments.length > 0 && !selectedDept) {
      setSelectedDept(departments[0]);
    }
  }, [departments, selectedDept]);

  useEffect(() => {
    if (usersInDept.length > 0) {
      setSelectedUserId(usersInDept[0].internalId);
    } else {
      setSelectedUserId('');
    }
  }, [usersInDept]);

  // Reset OTP state when changing user or toggling mode
  useEffect(() => {
    setOtpSent(false);
    setOtpCode('');
    setMobileNumber('');
  }, [selectedUserId, isDevMode]);

  const handleSendOtp = async (userMobile: string) => {
    if (!userMobile) {
      toast({
        title: "ไม่พบเบอร์โทรศัพท์",
        description: "ผู้ใช้งานนี้ยังไมได้ลงทะเบียนเบอร์โทรศัพท์ในระบบ",
        variant: "destructive"
      });
      return;
    }

    setIsSendingOtp(true);
    setMobileNumber(userMobile); // Store for ref

    try {
      const res = await fetch(`${API_BASE_URL}/otp/request?mobile_no=${userMobile}`);
      const data = await res.json();

      let refCode = '';

      if (typeof data === 'string') {
        const refMatch = data.match(/Ref:\s*([A-Za-z0-9]+)/);
        refCode = refMatch ? refMatch[1] : '';
      } else if (data.returnValue) {
        refCode = data.returnValue;
      }

      if (refCode || typeof data === 'string') {
        setOtpSent(true);
        toast({
          title: "ส่ง OTP สำเร็จ",
          description: `รหัส OTP ถูกส่งไปยัง ${userMobile} แล้ว${refCode ? ` (Ref: ${refCode})` : ''}`,
        });
      } else {
        throw new Error(data.error || `Invalid response: ${JSON.stringify(data)}`);
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "ส่ง OTP ไม่สำเร็จ (ข้อผิดพลาด)",
        description: error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ OTP",
        variant: "destructive"
      });
      // Do not allow proceeding if OTP failed
      setOtpSent(false);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userToLogin = allUsers.find(user => user.internalId === selectedUserId);

    if (!userToLogin) return;

    if (!isDevMode) {
      if (!otpSent) {
        // Step 1: Request OTP
        if (!userToLogin.mobile) {
          toast({
            title: "ไม่พบเบอร์โทรศัพท์",
            description: "กรุณาติดต่อผู้ดูแลระบบเพื่อเพิ่มเบอร์โทรศัพท์",
            variant: "destructive"
          });
          return;
        }
        const mobile = userToLogin.mobile;
        handleSendOtp(mobile);
      } else {
        // Step 2: Verify OTP
        if (otpCode.length < 4) return;

        // Mock Verification
        toast({
          title: "เข้าสู่ระบบสำเร็จ",
          description: "ยืนยันตัวตนเรียบร้อยแล้ว",
          variant: "default"
        });
        login(userToLogin);
      }
    } else {
      // Standard Login
      login(userToLogin);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-50 p-4 relative animate-fade-in">
      {/* Supabase Badge - Top Left */}
      <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-cyan-100/80 backdrop-blur-sm rounded-full border border-cyan-200/50 shadow-sm">
        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
        <span className="text-xs font-semibold text-cyan-700">Powered by Supabase</span>
      </div>

      {/* Dev Mode Toggle - Top Right (Hidden if not Dev UI) */}
      {IS_DEBUG && (
        <Button
          onClick={() => setIsDevMode(!isDevMode)}
          variant={isDevMode ? "default" : "outline"}
          size="icon"
          className={`absolute top-6 right-6 rounded-full shadow-md transition-all h-10 w-10 bg-white/80 backdrop-blur-sm hover:scale-105 active:scale-95 border-cyan-200`}
          title="Toggle Dev Mode"
        >
          <Code className="h-5 w-5 text-cyan-700" />
        </Button>
      )}

      <Card className="w-full max-w-md shadow-2xl shadow-cyan-100/50 border border-cyan-100/50 rounded-3xl overflow-hidden bg-white/95 backdrop-blur-xl">
        <CardHeader className="text-center pt-10 pb-6 bg-gradient-to-b from-cyan-50/50 to-transparent">
          <div className="bg-gradient-to-tr from-cyan-500 via-blue-500 to-sky-500 w-20 h-20 rounded-2xl rotate-3 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-cyan-500/30 transform transition-transform hover:rotate-6 hover:scale-105">
            <Network className="text-white w-10 h-10" />
          </div>
          <CardTitle className="font-headline text-3xl text-gray-800 tracking-tight bg-gradient-to-r from-cyan-600 via-blue-600 to-sky-600 bg-clip-text text-transparent">
            Performance Eval
          </CardTitle>
          <CardDescription className="text-base text-gray-600 mt-2 font-medium">
            ระบบประเมินผลการปฏิบัติงานเจ้าหน้าที่ สอ.มก.
          </CardDescription>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-full border border-cyan-200/50">
            <span className="text-xs font-semibold text-cyan-700">v{APP_VERSION}</span>
            <span className="text-xs text-cyan-600">•</span>
            <span className="text-xs text-blue-600">Supabase Edition</span>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
              <p className="text-muted-foreground text-sm font-medium animate-pulse">กำลังเชื่อมต่อฐานข้อมูล...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-2">
                <Label htmlFor="department-select" className="text-gray-700 font-medium ml-1">สายการประเมิน</Label>
                <div className="relative">
                  <Select value={selectedDept} onValueChange={setSelectedDept}>
                    <SelectTrigger id="department-select" className="h-14 rounded-2xl border-cyan-200 bg-cyan-50/30 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 px-4 text-base shadow-sm transition-all">
                      <SelectValue placeholder="เลือกสายการประเมิน" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border border-cyan-100">
                      {departments.map(d => <SelectItem key={d} value={d} className="py-3 px-4 focus:bg-cyan-50 rounded-lg cursor-pointer text-base">{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-select" className="text-gray-700 font-medium ml-1">ชื่อผู้ใช้งาน</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={usersInDept.length === 0}>
                  <SelectTrigger id="user-select" className="h-14 rounded-2xl border-cyan-200 bg-cyan-50/30 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 px-4 text-base shadow-sm transition-all">
                    <SelectValue placeholder="เลือกผู้ใช้งาน" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border border-cyan-100 max-h-[300px]">
                    {usersInDept.map(u => (
                      <SelectItem key={u.internalId} value={u.internalId} className="py-3 pl-8 pr-4 focus:bg-cyan-50 rounded-lg cursor-pointer data-[highlighted]:bg-cyan-50 [&[data-highlighted]_span:first-of-type]:!text-cyan-700 [&[data-highlighted]_span:last-of-type]:!text-cyan-600">
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-100 shadow-sm">
                            <Image src={u.img} fill className="object-cover" alt={u.name} />
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="font-medium text-gray-900 text-sm">{u.name}</span>
                            <span className="text-xs text-gray-500">{u.position}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!isDevMode && (
                <div className="p-5 bg-gradient-to-r from-cyan-50 via-blue-50 to-sky-50 rounded-2xl border border-cyan-200/50 text-cyan-800 shadow-sm">
                  <div className="font-bold mb-2 flex items-center gap-2 text-cyan-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse shadow-lg shadow-cyan-500/50"></span>
                    โหมดเข้าสู่ระบบด้วย OTP
                  </div>
                  {!otpSent ? (
                    <p className="text-sm text-cyan-600/90 leading-relaxed">ระบบจะส่งรหัส OTP ไปยังเบอร์โทรศัพท์ที่ท่านลงทะเบียนไว้ เพื่อยืนยันตัวตน</p>
                  ) : (
                    <div className="space-y-4 mt-3 animate-in slide-in-from-top-2">
                      <Label className="text-cyan-700 font-medium">กรอกรหัส OTP (4 หลัก)</Label>
                      <Input
                        placeholder="• • • •"
                        className="text-center tracking-[1em] text-2xl font-bold h-16 bg-white border-cyan-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 rounded-xl shadow-sm placeholder:tracking-widest placeholder:text-cyan-200/50"
                        maxLength={4}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        autoFocus
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                      <div className="flex justify-between items-center px-1">
                        <p className="text-xs text-cyan-600 font-medium bg-cyan-100/50 px-2 py-1 rounded-md">ส่งไปยัง: {mobileNumber}</p>
                        <button type="button" onClick={() => setOtpSent(false)} className="text-xs text-cyan-600 underline hover:text-cyan-800">ขอใหม่</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg transition-all transform active:scale-[0.98] bg-gradient-to-r from-cyan-500 via-blue-500 to-sky-500 hover:from-cyan-600 hover:via-blue-600 hover:to-sky-600 shadow-cyan-500/30 hover:shadow-cyan-500/50 text-white"
                size="lg"
                disabled={!selectedUserId || isSendingOtp || (!isDevMode && otpSent && otpCode.length < 4)}
              >
                {isSendingOtp ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/80"></span>
                    กำลังส่ง OTP...
                  </span>
                ) : (
                  (!isDevMode ? (otpSent ? "ยืนยันรหัส OTP" : "ขอรับรหัส OTP") : "เข้าสู่ระบบ")
                )}
                {!isSendingOtp && <ChevronRight className="ml-2 h-6 w-6 opacity-80" />}
              </Button>
            </form>
          )}

          {isDevMode && (
            <div className="mt-8 pt-6 border-t border-cyan-100 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2 text-cyan-600">
                  <Code className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Debug Mode: Quick Login</span>
                </div>
                <span className="text-[10px] bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-600 px-2 py-1 rounded-full font-mono border border-cyan-200">DEBUG</span>
              </div>
              <ScrollArea className="h-64 -mr-4 pr-4">
                <div className="space-y-2 pb-2">
                  {allUsers
                    .filter(u => u.isActive)
                    .sort((a, b) => {
                      // 1. Committee Last
                      const isCommitteeA = a.role === ROLES.COMMITTEE;
                      const isCommitteeB = b.role === ROLES.COMMITTEE;
                      if (isCommitteeA && !isCommitteeB) return 1;
                      if (!isCommitteeA && isCommitteeB) return -1;

                      // 2. Role Priority (Manager > Asst > Head > Staff)
                      const rolePriority = [ROLES.MANAGER, ROLES.ASST, ROLES.HEAD, ROLES.STAFF];
                      const priorityA = rolePriority.indexOf(a.role);
                      const priorityB = rolePriority.indexOf(b.role);
                      if (priorityA !== -1 && priorityB !== -1 && priorityA !== priorityB) {
                        return priorityA - priorityB;
                      }

                      // 3. Name (Thai Alphabetical)
                      return a.name.localeCompare(b.name, 'th');
                    })
                    .map(u => (
                      <div
                        key={u.internalId}
                        onClick={() => login(u)}
                        className="flex items-center gap-3 p-3 bg-white hover:bg-cyan-50 rounded-xl border border-cyan-100 hover:border-cyan-200 cursor-pointer transition-all active:scale-[0.99] group shadow-sm hover:shadow-md"
                      >
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm group-hover:border-cyan-100 transition-colors">
                          <Image src={u.img} fill className="object-cover" alt={u.name} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="text-sm font-bold truncate text-gray-800 group-hover:text-cyan-700 transition-colors">
                            {u.name}
                            {u.isAdmin && <span className="ml-2 text-[9px] bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-1.5 py-0.5 rounded-md font-bold tracking-wide align-middle">ADMIN</span>}
                          </div>
                          <div className="text-xs text-gray-500 group-hover:text-gray-700 truncate flex items-center gap-1.5 mt-0.5">
                            <span className="bg-cyan-50 px-1.5 py-0.5 rounded-md border border-cyan-200 text-[10px] font-medium group-hover:bg-cyan-100 group-hover:border-cyan-300 group-hover:text-cyan-700">{u.dept}</span>
                            <span className="truncate">{u.position}</span>
                          </div>
                        </div>

                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-100/40 rounded-full blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-3xl opacity-60 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-sky-200/20 rounded-full blur-3xl opacity-40 animate-pulse delay-500"></div>
      </div>
    </div>
  );
};

export default LoginPage;
