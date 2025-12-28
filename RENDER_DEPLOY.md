# 🚀 คู่มือ Deploy บน Render.com

## 📝 ขั้นตอนการ Deploy

### 1. ตั้งค่า Environment Variables ใน Render

**สำคัญ:** ต้องตั้งค่า Environment Variables ก่อน deploy ครั้งแรก

1. ไปที่ Render Dashboard → **Environment** → **Environment Variables**
2. เพิ่ม variables ต่อไปนี้:

```
NEXT_PUBLIC_SUPABASE_URL=https://fcezmzydokhxlajxaxdq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Optional (สำหรับ server-side operations):**
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Optional (สำหรับ basePath ถ้าต้องการใช้ subpath):**
```
NEXT_PUBLIC_BASE_PATH=/kuscc-eval
```

### 2. วิธีหา Supabase Keys

1. ไปที่ [Supabase Dashboard](https://app.supabase.com/project/fcezmzydokhxlajxaxdq)
2. ไปที่ **Settings** → **API**
3. คัดลอก:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (ถ้าต้องการ) → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Deploy บน Render.com

**วิธีที่ 1: ใช้ render.yaml (แนะนำ)**

1. ไปที่ [Render Dashboard](https://dashboard.render.com)
2. กด **New +** → **Blueprint**
3. เชื่อมต่อ GitHub repository ที่มีไฟล์ `render.yaml`
4. Render จะอ่านการตั้งค่าจาก `render.yaml` อัตโนมัติ
5. ตั้งค่า Environment Variables ใน Render Dashboard
6. กด **Apply** เพื่อเริ่ม deploy

**วิธีที่ 2: ใช้ Manual Deploy**

1. ไปที่ [Render Dashboard](https://dashboard.render.com)
2. กด **New +** → **Web Service**
3. เชื่อมต่อ GitHub repository
4. ตั้งค่าดังนี้:
   - **Name:** `hr-evaluation-app` (หรือชื่อที่ต้องการ)
   - **Region:** เลือก region ที่ใกล้ที่สุด (เช่น Singapore, Tokyo)
   - **Branch:** `main` (หรือ branch ที่ต้องการ deploy)
   - **Root Directory:** `.` (root ของโปรเจค)
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** เลือกตามความต้องการ (Free tier หรือ Paid)
5. กด **Create Web Service**

### 4. การตั้งค่า Build & Start Commands

Render จะใช้คำสั่งต่อไปนี้โดยอัตโนมัติ:

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

**หมายเหตุ:** Next.js จะ build เป็น standalone mode ตามที่ตั้งค่าไว้ใน `next.config.mjs` ดังนั้นคำสั่ง `npm start` จะใช้ไฟล์ที่ build แล้วจาก `.next/standalone`

### 5. ตรวจสอบการ Deploy

- ✅ Build ผ่านโดยไม่มี error
- ✅ Environment variables ถูกตั้งค่าเรียบร้อย
- ✅ Web Service status เป็น "Live"
- ✅ หน้าเว็บสามารถเชื่อมต่อ Supabase ได้

### 6. Custom Domain (Optional)

1. ไปที่ Web Service → **Settings** → **Custom Domains**
2. เพิ่ม domain ที่ต้องการ
3. ตั้งค่า DNS records ตามที่ Render แนะนำ
4. รอให้ SSL certificate ถูกสร้างอัตโนมัติ

## 🔧 การตั้งค่าพิเศษสำหรับ Render.com

### Node.js Version

โปรเจคใช้ Node.js 18.x ตามที่ระบุใน `package.json`:
```json
"engines": {
  "node": "18.x"
}
```

Render จะใช้ version นี้โดยอัตโนมัติ

### Base Path Configuration

ถ้าต้องการใช้ basePath (เช่น `/kuscc-eval`), ตั้งค่า environment variable:
```
NEXT_PUBLIC_BASE_PATH=/kuscc-eval
```

ถ้าไม่ตั้งค่า basePath จะเป็น root path (`/`)

### Health Check

Render จะตรวจสอบ health check ที่ `/` path โดยอัตโนมัติ Next.js จะ serve หน้าแรกที่ path นี้

## 🐛 Troubleshooting

### Error: "Server configuration missing. Please set environment variables."

**สาเหตุ:** Environment variables ยังไม่ได้ตั้งค่าใน Render หรือตั้งค่าไม่ถูกต้อง

**แก้ไข:**
1. ไปที่ Render Dashboard → Web Service → **Environment**
2. ตรวจสอบว่ามี variables ต่อไปนี้:
   - `NEXT_PUBLIC_SUPABASE_URL` (ต้องมี `NEXT_PUBLIC_` prefix)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ต้องมี `NEXT_PUBLIC_` prefix)
3. **สำคัญ:** หลังจากตั้งค่า environment variables ต้อง **Manual Deploy**:
   - ไปที่ **Manual Deploy** → **Deploy latest commit**
   - หรือ push commit ใหม่เพื่อ trigger auto-deploy
4. ตรวจสอบว่า variable names ถูกต้อง (ต้องมี `NEXT_PUBLIC_` prefix)
5. ตรวจสอบว่า values ไม่มี space หรืออักขระพิเศษเพิ่มเติม

### Error: "Supabase URL or Anon Key is missing"

**แก้ไข:**
- ดูที่ error ด้านบน (มักเกิดจากสาเหตุเดียวกัน)

### Error: "Build failed" หรือ "Build timeout"

**แก้ไข:**
1. ตรวจสอบ logs ใน Render Dashboard → **Logs** tab
2. ตรวจสอบว่า `package.json` มี dependencies ครบถ้วน
3. ตรวจสอบว่า Node.js version ถูกต้อง (18.x)
4. ลองเพิ่ม build time limit ใน render.yaml:
   ```yaml
   buildCommand: npm install && npm run build
   ```
5. ตรวจสอบว่า build command ไม่มี error

### Build ผ่านแต่หน้าเว็บไม่ทำงาน (Connection Error หรือ 502/503)

**ตรวจสอบ:**
1. เปิด Browser DevTools (F12)
2. ไปที่ **Console** tab เพื่อดู error messages
3. ไปที่ **Network** tab เพื่อดู API calls
   - ดูว่า `/api/init` หรือ API อื่นๆ return อะไร
   - ตรวจสอบ status code (503 = server configuration missing)
4. ตรวจสอบ Render Logs → **Logs** tab เพื่อดู runtime errors
5. ตรวจสอบ Supabase Dashboard → **Logs** เพื่อดู database queries
6. ตรวจสอบว่า Environment Variables ถูกตั้งค่าแล้วใน Render Dashboard
7. **Manual Deploy** อีกครั้งหลังจากตั้งค่า environment variables

### Error: "Port already in use" หรือ "EADDRINUSE"

**แก้ไข:**
- Render จะ inject `PORT` environment variable โดยอัตโนมัติ
- Next.js จะใช้ `PORT` จาก environment variable โดยอัตโนมัติ
- ไม่ต้องตั้งค่า PORT ใน environment variables

### Error: "Module not found" หรือ "Cannot find module"

**แก้ไข:**
1. ตรวจสอบว่า dependencies ถูก install ครบใน build logs
2. ลบ `node_modules` และ `package-lock.json` แล้ว commit ใหม่
3. ตรวจสอบว่า build command รัน `npm install` ก่อน `npm run build`

### Build Timeout

**แก้ไข:**
1. Render Free tier มี build timeout 10 นาที
2. ถ้า build ใช้เวลานาน อาจต้อง upgrade เป็น Paid plan
3. ลด dependencies ที่ไม่จำเป็น
4. ใช้ `.npmrc` เพื่อ optimize npm install

## 📚 เอกสารเพิ่มเติม

- [Render.com Documentation](https://render.com/docs)
- [Deploy Next.js on Render](https://render.com/docs/deploy-nextjs)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Setup Guide](./SUPABASE_SETUP.md)

## 💡 Tips & Best Practices

1. **ใช้ render.yaml:** ทำให้การตั้งค่าสม่ำเสมอและ version controlled
2. **ตั้งค่า Environment Variables ก่อน deploy:** เพื่อหลีกเลี่ยง build errors
3. **ตรวจสอบ Logs:** ใช้ Render Logs เพื่อ debug issues
4. **Auto-deploy:** เชื่อมต่อ GitHub เพื่อ auto-deploy เมื่อมี commit ใหม่
5. **Health Checks:** Render จะตรวจสอบ health check ที่ root path โดยอัตโนมัติ
6. **SSL:** Render จะให้ SSL certificate ฟรีอัตโนมัติ
7. **Branch Deploys:** สามารถ deploy branch อื่นเป็น preview environment ได้

