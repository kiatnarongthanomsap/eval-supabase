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
import { APP_VERSION, ROLES, SHOW_DEV_UI } from '@/lib/constants';
import { formatSalaryGroup } from '@/lib/helpers';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

const LoginPage = () => {
  const { login, allUsers, isLoading } = useAppContext();
  const [isDevMode, setIsDevMode] = useState(SHOW_DEV_UI);
  const [isOtpMode, setIsOtpMode] = useState(!SHOW_DEV_UI); // Default to OTP if not in Dev UI mode
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
  }, [selectedUserId, isOtpMode]);

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
      const res = await fetch(`/api/otp/request?mobile_no=${userMobile}`);
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

    if (isOtpMode) {
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4 relative animate-fade-in">
      {/* OTP Toggle - Top Left (Hidden if not Dev UI) */}
      {SHOW_DEV_UI && (
        <Button
          onClick={() => setIsOtpMode(!isOtpMode)}
          variant={isOtpMode ? "default" : "outline"}
          className={`absolute top-4 left-4 bg-white/80 backdrop-blur-sm shadow-sm transition-all gap-2 h-10 rounded-full ${isOtpMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'hover:bg-gray-100'}`}
          title="Toggle OTP Login"
        >
          <Smartphone className="h-4 w-4" />
          <span className="hidden sm:inline">{isOtpMode ? "OTP Login: ON" : "OTP Login: OFF"}</span>
        </Button>
      )}

      {/* Dev Mode Toggle - Top Right (Hidden if not Dev UI) */}
      {SHOW_DEV_UI && (
        <Button
          onClick={() => setIsDevMode(!isDevMode)}
          variant={isDevMode ? "default" : "outline"}
          size="icon"
          className={`absolute top-6 right-6 rounded-full shadow-md transition-all h-10 w-10 bg-white/80 backdrop-blur-sm hover:scale-105 active:scale-95`}
          title="Toggle Dev Mode"
        >
          <Code className="h-5 w-5 text-gray-700" />
        </Button>
      )}

      <Card className="w-full max-w-md shadow-2xl shadow-indigo-100 border-0 rounded-3xl overflow-hidden bg-white/90 backdrop-blur-xl">
        <CardHeader className="text-center pt-10 pb-6">
          <div className="bg-gradient-to-tr from-primary to-indigo-600 w-20 h-20 rounded-2xl rotate-3 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30 transform transition-transform hover:rotate-6">
            <Network className="text-white w-10 h-10" />
          </div>
          <CardTitle className="font-headline text-3xl text-gray-800 tracking-tight">Performance Eval</CardTitle>
          <CardDescription className="text-base text-gray-500 mt-2">ระบบประเมินผลการปฏิบัติงานเจ้าหน้าที่ สอ.มก.</CardDescription>
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
                    <SelectTrigger id="department-select" className="h-14 rounded-2xl border-gray-200 bg-gray-50/50 focus:ring-2 focus:ring-primary/20 focus:border-primary px-4 text-base shadow-sm">
                      <SelectValue placeholder="เลือกสายการประเมิน" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-0">
                      {departments.map(d => <SelectItem key={d} value={d} className="py-3 px-4 focus:bg-indigo-50 rounded-lg cursor-pointer text-base">{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-select" className="text-gray-700 font-medium ml-1">ชื่อผู้ใช้งาน</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={usersInDept.length === 0}>
                  <SelectTrigger id="user-select" className="h-14 rounded-2xl border-gray-200 bg-gray-50/50 focus:ring-2 focus:ring-primary/20 focus:border-primary px-4 text-base shadow-sm">
                    <SelectValue placeholder="เลือกผู้ใช้งาน" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border-0 max-h-[300px]">
                    {usersInDept.map(u => (
                      <SelectItem key={u.internalId} value={u.internalId} className="py-3 pl-8 pr-4 focus:bg-indigo-50 rounded-lg cursor-pointer data-[highlighted]:bg-indigo-50 [&[data-highlighted]_span:first-of-type]:!text-primary [&[data-highlighted]_span:last-of-type]:!text-primary/70">
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

              {isOtpMode && (
                <div className="p-5 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 text-emerald-800 shadow-inner">
                  <div className="font-bold mb-2 flex items-center gap-2 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></span>
                    โหมดเข้าสู่ระบบด้วย OTP
                  </div>
                  {!otpSent ? (
                    <p className="text-sm text-emerald-600/90 leading-relaxed">ระบบจะส่งรหัส OTP ไปยังเบอร์โทรศัพท์ที่ท่านลงทะเบียนไว้ เพื่อยืนยันตัวตน</p>
                  ) : (
                    <div className="space-y-4 mt-3 animate-in slide-in-from-top-2">
                      <Label className="text-emerald-700 font-medium">กรอกรหัส OTP (4 หลัก)</Label>
                      <Input
                        placeholder="• • • •"
                        className="text-center tracking-[1em] text-2xl font-bold h-16 bg-white border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-xl shadow-sm placeholder:tracking-widest placeholder:text-emerald-200/50"
                        maxLength={4}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        autoFocus
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                      <div className="flex justify-between items-center px-1">
                        <p className="text-xs text-emerald-600 font-medium bg-emerald-100/50 px-2 py-1 rounded-md">ส่งไปยัง: {mobileNumber}</p>
                        <button type="button" onClick={() => setOtpSent(false)} className="text-xs text-emerald-600 underline hover:text-emerald-800">ขอใหม่</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className={`w-full h-14 text-lg font-bold rounded-2xl shadow-lg transition-all transform active:scale-[0.98] ${isOtpMode
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 shadow-primary/30'
                  }`}
                size="lg"
                disabled={!selectedUserId || isSendingOtp || (isOtpMode && otpSent && otpCode.length < 4)}
              >
                {isSendingOtp ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/80"></span>
                    กำลังส่ง OTP...
                  </span>
                ) : (
                  (isOtpMode ? (otpSent ? "ยืนยันรหัส OTP" : "ขอรับรหัส OTP") : "เข้าสู่ระบบ")
                )}
                {!isSendingOtp && <ChevronRight className="ml-2 h-6 w-6 opacity-80" />}
              </Button>
            </form>
          )}

          <div className="text-center mt-8 text-[10px] text-gray-300 font-mono uppercase tracking-widest">
            v{APP_VERSION}
          </div>

          {isDevMode && (
            <div className="mt-8 pt-6 border-t border-gray-100 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Code className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Dev Mode: Quick Login</span>
                </div>
                <span className="text-[10px] bg-indigo-50 text-indigo-400 px-2 py-1 rounded-full font-mono">DEBUG</span>
              </div>
              <ScrollArea className="h-64 -mr-4 pr-4">
                <div className="space-y-2 pb-2">
                  {allUsers.filter(u => u.isActive).map(u => (
                    <div
                      key={u.internalId}
                      onClick={() => login(u)}
                      className="flex items-center gap-3 p-3 bg-white hover:bg-indigo-50 rounded-xl border border-gray-100 hover:border-indigo-200 cursor-pointer transition-all active:scale-[0.99] group shadow-sm hover:shadow-md"
                    >
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm group-hover:border-indigo-100 transition-colors">
                        <Image src={u.img} fill className="object-cover" alt={u.name} />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-bold truncate text-gray-800 group-hover:text-indigo-700 transition-colors">
                          {u.name}
                          {u.isAdmin && <span className="ml-2 text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-md font-bold tracking-wide align-middle">ADMIN</span>}
                        </div>
                        <div className="text-xs text-gray-500 group-hover:text-gray-700 truncate flex items-center gap-1.5 mt-0.5">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200 text-[10px] font-medium group-hover:bg-indigo-50 group-hover:border-indigo-200 group-hover:text-indigo-700">{u.dept}</span>
                          <span className="truncate">{u.position}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-right min-w-[60px]">
                        <span className="text-[10px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded border border-gray-100 group-hover:border-indigo-100 group-hover:text-indigo-400 font-mono transition-colors">{formatSalaryGroup(u.salaryGroup)}</span>
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
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-100/40 rounded-full blur-3xl opacity-60 animate-pulse delay-1000"></div>
      </div>
    </div>
  );
};

export default LoginPage;
