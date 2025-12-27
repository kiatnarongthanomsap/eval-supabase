# 🚀 คู่มือ Deploy บน Netlify

## 📝 ขั้นตอนการ Deploy

### 1. ตั้งค่า Environment Variables ใน Netlify

**สำคัญ:** ต้องตั้งค่า Environment Variables ก่อน deploy ครั้งแรก

1. ไปที่ Netlify Dashboard → **Site settings** → **Environment variables**
2. เพิ่ม variables ต่อไปนี้:

```
NEXT_PUBLIC_SUPABASE_URL=https://fcezmzydokhxlajxaxdq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Optional (สำหรับ server-side operations):**
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. วิธีหา Supabase Keys

1. ไปที่ [Supabase Dashboard](https://app.supabase.com/project/fcezmzydokhxlajxaxdq)
2. ไปที่ **Settings** → **API**
3. คัดลอก:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (ถ้าต้องการ) → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Deploy

**วิธีที่ 1: ใช้ Netlify Dashboard**
1. ไปที่ [Netlify Dashboard](https://app.netlify.com)
2. กด **Add new site** → **Import an existing project**
3. เชื่อมต่อ GitHub repository
4. ตั้งค่า:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
5. กด **Deploy site**

**วิธีที่ 2: ใช้ Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### 4. ตรวจสอบการ Deploy

- ✅ Build ผ่านโดยไม่มี error
- ✅ Environment variables ถูกตั้งค่าเรียบร้อย
- ✅ หน้าเว็บสามารถเชื่อมต่อ Supabase ได้

## 🐛 Troubleshooting

### Error: "Supabase URL or Anon Key is missing"

**แก้ไข:**
- ตรวจสอบว่า Environment Variables ถูกตั้งค่าใน Netlify Dashboard แล้ว
- ตรวจสอบว่า variable names ถูกต้อง (ต้องมี `NEXT_PUBLIC_` prefix)
- **Redeploy** หลังจากตั้งค่า environment variables

### Error: "Failed to collect page data"

**แก้ไข:**
- ตรวจสอบว่า Environment Variables ถูกตั้งค่าแล้ว
- API routes ถูกตั้งค่าเป็น `dynamic = 'force-dynamic'` แล้ว (ทำไปแล้ว)

### Build ผ่านแต่หน้าเว็บไม่ทำงาน

**ตรวจสอบ:**
- Console ใน browser เพื่อดู error messages
- Network tab เพื่อดู API calls
- Supabase Dashboard → Logs เพื่อดู database queries

## 📚 เอกสารเพิ่มเติม

- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Setup Guide](./SUPABASE_SETUP.md)

