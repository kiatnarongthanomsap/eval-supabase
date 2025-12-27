"use client";
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { User, Role } from "@/lib/types";
import { ROLES, ROLE_LABELS } from "@/lib/constants";

interface UserFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Partial<User>) => void;
  user: Partial<User> | null;
}

export function UserFormDialog({ isOpen, onClose, onSave, user }: UserFormDialogProps) {
  const [isAdmin, setIsAdmin] = React.useState(!!user?.isAdmin);
  const [canViewReport, setCanViewReport] = React.useState(!!user?.canViewReport);

  // Sync state when user changes
  React.useEffect(() => {
    setIsAdmin(!!user?.isAdmin);
    setCanViewReport(!!user?.canViewReport);
  }, [user]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const userData: Partial<User> = {
      orgId: Number(formData.get('orgId')),
      memberId: formData.get('memberId') as string,
      name: formData.get('name') as string,
      position: formData.get('position') as string,
      dept: formData.get('dept') as string,
      salary: Number(formData.get('salary')),
      role: formData.get('role') as Role,
      mobile: formData.get('mobile') as string,
      email: formData.get('email') as string,
      isAdmin: isAdmin,
      canViewReport: canViewReport,
    };
    onSave(userData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] animate-fade-in-up">
        <DialogHeader>
          <DialogTitle className="font-heading">{user ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orgId">รหัสพนักงาน</Label>
              <Input id="orgId" name="orgId" type="number" defaultValue={user?.orgId || ''} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberId">เลขสมาชิก</Label>
              <Input id="memberId" name="memberId" defaultValue={user?.memberId || ''} placeholder="สำหรับดึงรูปภาพ" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">เบอร์โทรศัพท์</Label>
              <Input id="mobile" name="mobile" defaultValue={user?.mobile || ''} placeholder="08xxxxxxxx" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อ-นามสกุล</Label>
              <Input id="name" name="name" defaultValue={user?.name || ''} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">ตำแหน่ง</Label>
              <Input id="position" name="position" defaultValue={user?.position || ''} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input id="email" name="email" type="email" defaultValue={user?.email || ''} placeholder="example@coop.ku.ac.th" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dept">แผนก</Label>
              <Input id="dept" name="dept" defaultValue={user?.dept || ''} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary">เงินเดือน</Label>
              <Input id="salary" name="salary" type="number" defaultValue={user?.salary || ''} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">บทบาท</Label>
              <Select name="role" defaultValue={user?.role || ROLES.STAFF}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="เลือกบทบาท" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-6 pt-4 border-t mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAdmin"
                checked={isAdmin}
                onCheckedChange={(checked) => setIsAdmin(!!checked)}
              />
              <Label htmlFor="isAdmin" className="font-medium">สิทธิ์แอดมิน</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canViewReport"
                checked={canViewReport}
                onCheckedChange={(checked) => setCanViewReport(!!checked)}
              />
              <Label htmlFor="canViewReport" className="font-medium">สิทธิ์ดูรายงาน</Label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">ยกเลิก</Button>
            </DialogClose>
            <Button type="submit">บันทึก</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
