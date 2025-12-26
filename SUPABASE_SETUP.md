# Supabase Setup Guide

คู่มือการตั้งค่าและใช้งาน Supabase สำหรับ HR Evaluation System

## ขั้นตอนการติดตั้ง

### 1. สร้าง Supabase Project

1. ไปที่ [Supabase Dashboard](https://app.supabase.com)
2. สร้างโปรเจคใหม่
3. บันทึก URL และ API keys

### 2. ตั้งค่า Environment Variables

ไฟล์ `.env.local` ถูกสร้างไว้แล้วพร้อม credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://uuharymonhyvyqxvlkqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_F_YI7jgthOfWSqVXM5mi7Q_W93Ts9fp
```

**หมายเหตุ:** 
- ✅ Supabase URL และ Anon Key ถูกตั้งค่าไว้แล้ว (โปรเจคใหม่)
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` ยังไม่ได้ตั้งค่า (optional สำหรับ server-side operations)
  - หาได้จาก Supabase Dashboard > Settings > API > service_role key
  - เพิ่มใน `.env.local` ถ้าต้องการใช้ elevated permissions

### 3. สร้าง Database Schema

1. เปิด Supabase SQL Editor
2. คัดลอกเนื้อหาจากไฟล์ `supabase/schema.sql`
3. รัน SQL script เพื่อสร้างตารางและ policies

### 4. Import ข้อมูลเริ่มต้น (Optional)

หากมีข้อมูลจาก MySQL database เดิม:

1. Export ข้อมูลจาก MySQL เป็น CSV หรือ JSON
2. ใช้ Supabase Dashboard > Table Editor เพื่อ import ข้อมูล
3. หรือใช้ migration script (ดู `supabase/migrate-data.sql`)

### 5. ตรวจสอบ Row Level Security (RLS)

ใน Supabase Dashboard:
- ไปที่ Authentication > Policies
- ตรวจสอบว่า policies ถูกตั้งค่าตามที่ต้องการ
- สำหรับ development อาจใช้ permissive policies
- สำหรับ production ควรตั้งค่า policies ที่เข้มงวดกว่า

## API Routes

ระบบใช้ Next.js API Routes แทน PHP backend:

- `GET /api/init` - ดึงข้อมูลเริ่มต้น (users, criteria, scores, etc.)
- `POST /api/login` - Login ด้วย org_id
- `POST /api/score` - อัปเดตคะแนน
- `POST /api/comment` - อัปเดตความคิดเห็น
- `GET /api/users` - ดึงรายชื่อผู้ใช้
- `POST /api/users` - บันทึกผู้ใช้
- `DELETE /api/users` - ลบผู้ใช้
- `GET /api/criteria` - ดึงหลักเกณฑ์
- `POST /api/criteria` - บันทึกหลักเกณฑ์
- `DELETE /api/criteria` - ลบหลักเกณฑ์
- `GET /api/config` - ดึงการตั้งค่าระบบ
- `POST /api/config` - อัปเดตการตั้งค่าระบบ
- `GET /api/exclusions` - ดึงข้อยกเว้น
- `POST /api/exclusions` - เพิ่มข้อยกเว้น
- `DELETE /api/exclusions` - ลบข้อยกเว้น
- `POST /api/reset` - รีเซ็ตข้อมูลคะแนนและความคิดเห็น

## การย้ายข้อมูลจาก MySQL

### วิธีที่ 1: ใช้ Supabase Dashboard

1. Export ข้อมูลจาก MySQL เป็น CSV
2. ไปที่ Supabase Dashboard > Table Editor
3. เลือกตารางที่ต้องการ
4. คลิก Import และเลือกไฟล์ CSV

### วิธีที่ 2: ใช้ SQL Script

ดูไฟล์ `supabase/migrate-data.sql` สำหรับตัวอย่างการ import ข้อมูล

## Troubleshooting

### ปัญหา: "Missing Supabase URL or Anon Key"

**แก้ไข:** ตรวจสอบว่าไฟล์ `.env.local` มีค่าถูกต้องและ restart development server

### ปัญหา: "Row Level Security policy violation"

**แก้ไข:** 
1. ตรวจสอบ RLS policies ใน Supabase Dashboard
2. สำหรับ development อาจใช้ permissive policies
3. ตรวจสอบว่า service role key ถูกใช้ใน server-side code

### ปัญหา: API routes ไม่ทำงาน

**แก้ไข:**
1. ตรวจสอบว่า Supabase client ถูก initialize ถูกต้อง
2. ตรวจสอบ console logs สำหรับ error messages
3. ตรวจสอบว่า environment variables ถูก load

## Security Notes

1. **Never expose Service Role Key** - ใช้เฉพาะใน server-side code
2. **Use RLS Policies** - ตั้งค่า Row Level Security ให้เหมาะสม
3. **Validate Input** - เพิ่ม validation ใน API routes
4. **Rate Limiting** - พิจารณาเพิ่ม rate limiting สำหรับ production

## Migration Checklist

- [ ] สร้าง Supabase project
- [ ] ตั้งค่า environment variables
- [ ] รัน database schema
- [ ] Import ข้อมูลเริ่มต้น (ถ้ามี)
- [ ] ทดสอบ API routes
- [ ] ตรวจสอบ RLS policies
- [ ] ทดสอบการทำงานของระบบทั้งหมด

