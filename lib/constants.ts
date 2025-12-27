import type { Role, Criteria, CriteriaCategory } from './types';

// --- Version Control ---
export const APP_VERSION = '3.0.0'; // Supabase Migration Version

// --- 1. Constants & Configuration ---
// Note: IS_DEBUG is now fetched from database (system_config.is_debug)
// Use getIsDebug() helper or access from systemConfig in AppProvider context
// Default fallback value
export const IS_DEBUG_DEFAULT = false; // Fallback if database value is not available (safer for production)

// Use Supabase API routes instead of PHP proxy
// Note: In development use '/api', in production use '/kuscc-eval/api'
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/kuscc-eval/api' 
  : '/api';

export const RECOMMENDED_ADJUSTMENT: { [key: string]: number } = {
  'บัญชี': 1.00,
  'การเงินและลงทุน': 0.85,
  'ไอที': 1.00,
  'สินเชื่อและกำแพงแสน': 0.90,
  'บริหารทั่วไป': 1.00,
  'รองผู้จัดการ': 1.00,
  'ผู้จัดการ': 1.00,
  'คณะกรรมการ': 1.00,
};

export const ROLES: { COMMITTEE: Role; MANAGER: Role; ASST: Role; HEAD: Role; STAFF: Role } = {
  COMMITTEE: 'COMMITTEE',
  MANAGER: 'MANAGER',
  ASST: 'ASST',
  HEAD: 'HEAD',
  STAFF: 'STAFF',
};

export const ROLE_LABELS: Record<Role, string> = {
  COMMITTEE: 'คณะกรรมการ',
  MANAGER: 'ผู้จัดการ',
  ASST: 'รอง/ผู้ช่วย',
  HEAD: 'หัวหน้าฝ่าย',
  STAFF: 'เจ้าหน้าที่',
};

const CRITERIA_PERFORMANCE: Criteria[] = [
  { id: '1.1', text: 'ปริมาณผลงาน (Quantity)', weight: 20, description: 'พิจารณาจากจำนวนปริมาณงานที่ปฏิบัติได้เทียบกับเป้าหมาย หรือภาระงานที่ได้รับมอบหมายในความรับผิดชอบ', category: 'PERF' },
  { id: '1.2', text: 'คุณภาพผลงาน (Quality)', weight: 20, description: 'ความถูกต้องแม่นยำของงาน ความเป็นระเบียบเรียบร้อย ความคุ้มค่า และการลดความสูญเสีย/ข้อผิดพลาด', category: 'PERF' },
  { id: '1.3', text: 'ความทันเวลา (Timeliness)', weight: 20, description: 'ความสามารถในการปฏิบัติงานให้เสร็จตามกำหนดเวลาที่นัดหมาย หรือทันต่อความต้องการใช้งานของสมาชิก', category: 'PERF' },
  { id: '1.4', text: 'ผลสัมฤทธิ์ของงาน (Achievement)', weight: 20, description: 'พิจารณาจากผลงานที่ส่งผลต่อความสำเร็จของส่วนงานหรือเป้าหมายหลักของสหกรณ์ฯ ในภาพรวม', category: 'PERF' },
  { id: '1.5', text: 'ความรับผิดชอบ (Responsibility)', weight: 20, description: 'ความทุ่มเท ความขยันหมั่นเพียร และความรับผิดชอบต่อหน้าที่ที่ได้รับมอบหมายจนสำเร็จลุล่วง', category: 'PERF' },
];

const CRITERIA_CHARACTERISTICS_OFFICER: Criteria[] = [
  { id: '2.1', text: 'ความสามารถในการปฏิบัติงาน', weight: 20, description: 'ความรู้ความเข้าใจในระเบียบ ข้อบังคับ และขั้นตอนการปฏิบัติงานในหน้าที่ของตนเอง', category: 'CHAR' },
  { id: '2.2', text: 'การแก้ไขปัญหาสถานการณ์เฉพาะหน้า', weight: 20, description: 'ความสามารถในการตัดสินใจแก้ไขปัญหาที่เกิดขึ้นอย่างกะทันหันได้อย่างถูกต้องและเหมาะสม', category: 'CHAR' },
  { id: '2.3', text: 'การเรียนรู้และพัฒนาปรับปรุงงาน', weight: 20, description: 'ความกระตือรือร้นในการศึกษาความรู้ใหม่ๆ และนำมาปรับปรุงกระบวนการทำงานให้ดีขึ้น', category: 'CHAR' },
  { id: '2.4', text: 'ความคิดริเริ่มสร้างสรรค์', weight: 10, description: 'การเสนอแนะแนวคิดใหม่ๆ หรือวิธีทำงานรูปแบบใหม่ที่เป็นประโยชน์ต่อส่วนงาน', category: 'CHAR' },
  { id: '2.5', text: 'การรักษาวินัย/มารยาท', weight: 10, description: 'การปฏิบัติตามระเบียบวินัย การแต่งกาย การมาทำงานตรงเวลา และกิริยามารยาทต่อเพื่อนร่วมงาน', category: 'CHAR' },
  { id: '2.6', text: 'การให้ความร่วมมือ/ประสานงาน', weight: 10, description: 'การทำงานร่วมกับผู้อื่นได้อย่างราบรื่น การช่วยเหลือเพื่อนร่วมงาน และการประสานงานข้ามส่วนงาน', category: 'CHAR' },
  { id: '2.7', text: 'มนุษยสัมพันธ์/ทัศนคติที่ดีต่อองค์กร', weight: 10, description: 'การมีทัศนคติเชิงบวกต่อสหกรณ์ฯ การแสดงออกที่เป็นมิตร และความจงรักภักดีต่อองค์กร', category: 'CHAR' },
  { id: '2.8', text: 'การมีส่วนร่วมในกิจกรรมสหกรณ์', weight: 10, description: 'การเข้าร่วมกิจกรรมที่สหกรณ์ฯ จัดขึ้น เช่น งานสวัสดิการ งานอาสา หรือกิจกรรมสัมพันธ์ต่างๆ', category: 'CHAR' },
  { id: '2.9', text: 'การให้บริการด้วยจิตบริการ (Service Mind)', weight: 10, description: 'ความเต็มใจในการให้บริการสมาชิกด้วยความยิ้มแย้ม แจ่มใส และความสุภาพเรียบร้อย', category: 'CHAR' },
];

const CRITERIA_CHARACTERISTICS_EXEC: Criteria[] = [
  { id: '2.1-E', text: 'การกำหนดทิศทางและเป้าหมาย', weight: 20, description: 'ความสามารถในการวางแผนงาน กำหนดทิศทาง และเป้าหมายระยะสั้น-ยาว ให้แก่ส่วนงาน', category: 'EXEC' },
  { id: '2.2-E', text: 'ทักษะในการสื่อสารจูงใจ', weight: 20, description: 'ความสามารถในการถ่ายทอดคำสั่ง นโยบาย และสร้างแรงจูงใจให้ผู้ใต้บังคับบัญชาปฏิบัติงานอย่างเต็มใจ', category: 'EXEC' },
  { id: '2.3-E', text: 'ความคิดริเริ่มสร้างสรรค์เชิงรุก', weight: 20, description: 'การมองหาโอกาสในการพัฒนาธุรกิจหรือบริการใหม่ๆ เพื่อความยั่งยืนของสหกรณ์ฯ', category: 'EXEC' },
  { id: '2.4-E', text: 'ความสามารถในการตัดสินใจ', weight: 20, description: 'ความกล้าหาญและรอบคอบในการตัดสินใจในเรื่องสำคัญๆ โดยคำนึงถึงประโยชน์สูงสุดของส่วนรวม', category: 'EXEC' },
  { id: '2.5-E', text: 'ทักษะในการฟังและรับความคิดเห็น', weight: 10, description: 'การเปิดใจรับฟังความคิดเห็นจากผู้ใต้บังคับบัญชาและนำมาปรับปรุงแก้ไขการทำงาน', category: 'EXEC' },
  { id: '2.6-E', text: 'ความสามารถในการแก้ปัญหาความขัดแย้ง', weight: 20, description: 'ความยุติธรรมและการจัดการปัญหาความขัดแย้งภายในกลุ่มงานได้อย่างมีประสิทธิภาพ', category: 'EXEC' },
  { id: '2.7-E', text: 'การมอบหมายและติดตามงาน', weight: 20, description: 'การเลือกคนที่เหมาะสมกับงาน (Put the right man on the right job) และการติดตามผลอย่างต่อเนื่อง', category: 'EXEC' },
  { id: '2.8-E', text: 'การเป็นผู้สนับสนุนและสร้างทีมงาน', weight: 10, description: 'การสนับสนุนเครื่องมือและทรัพยากร รวมถึงการสร้างบรรยากาศการทำงานที่ดีเป็นทีม', category: 'EXEC' },
  { id: '2.9-E', text: 'การเรียนรู้และพัฒนาตนเองอย่างต่อเนื่อง', weight: 10, description: 'การเป็นแบบอย่างที่ดีในการศึกษาหาความรู้และพัฒนาศักยภาพผู้บริหารอยู่เสมอ', category: 'EXEC' },
  { id: '2.10-E', text: 'การเป็นผู้สอนงาน (Coaching)', weight: 10, description: 'ความสามารถในการสอนงานและถ่ายทอดประสบการณ์เพื่อพัฒนาขีดความสามารถของลูกน้อง', category: 'EXEC' },
  { id: '2.11-E', text: 'การแก้ปัญหาสถานการณ์เฉพาะหน้า', weight: 20, description: 'ภาวะผู้นำในการแก้ไขวิกฤตหรือปัญหาที่ซับซ้อนภายใต้แรงกดดัน', category: 'EXEC' },
  { id: '2.12-E', text: 'การมีส่วนร่วมในกิจกรรมสหกรณ์', weight: 10, description: 'การเป็นผู้นำในการเข้าร่วมกิจกรรมของสหกรณ์ฯ และงานสังคมส่วนรวม', category: 'EXEC' },
  { id: '2.13-E', text: 'การให้บริการด้วยจิตบริการ (Service Mind)', weight: 10, description: 'ความแสดงภาพลักษณ์ที่ดีในการให้บริการ และการสนับสนุนวัฒนธรรมการบริการในส่วนงาน', category: 'EXEC' },
];


export const ALL_CRITERIA = {
  [ROLES.STAFF]: [...CRITERIA_PERFORMANCE, ...CRITERIA_CHARACTERISTICS_OFFICER],
  [ROLES.HEAD]: [...CRITERIA_PERFORMANCE, ...CRITERIA_CHARACTERISTICS_EXEC],
  [ROLES.ASST]: [...CRITERIA_PERFORMANCE, ...CRITERIA_CHARACTERISTICS_EXEC],
  [ROLES.MANAGER]: [...CRITERIA_PERFORMANCE, ...CRITERIA_CHARACTERISTICS_EXEC],
  [ROLES.COMMITTEE]: [], // คณะกรรมการไม่มีหลักเกณฑ์การประเมินตนเองในโครงสร้างนี้
};

export const INITIAL_CRITERIA: Criteria[] = Array.from(
  new Map(
    [
      ...CRITERIA_PERFORMANCE,
      ...CRITERIA_CHARACTERISTICS_OFFICER,
      ...CRITERIA_CHARACTERISTICS_EXEC,
    ].map(item => [item.id, item])
  ).values()
);


export const CRITERIA_CATEGORIES: CriteriaCategory[] = [
  { id: 'PERF', name: 'ด้านผลการปฏิบัติงาน (Performance)', color: 'bg-blue-50 text-blue-700' },
  { id: 'CHAR', name: 'ด้านคุณลักษณะ (Officer Characteristics)', color: 'bg-emerald-50 text-emerald-700' },
  { id: 'EXEC', name: 'ด้านคุณลักษณะ (Executive Characteristics)', color: 'bg-purple-50 text-purple-700' },
];

// --- 5. New Logic Constants (Final Score Weighting) ---
export const CATEGORY_WEIGHTS = {
  PERF: 0.60,
  CHAR: 0.40,
  EXEC: 0.40,
};

// Weights by Evaluated Person's Role and Evaluator's relationship
// Keys are the Evaluated Person's Role
// Values are weights for Superior, Committee, and Subordinate
export const EVALUATOR_WEIGHTS: Record<Role, { Superior: number; Committee: number; Subordinate: number }> = {
  MANAGER: { Superior: 0, Committee: 0.80, Subordinate: 0.20 },
  ASST: { Superior: 0.50, Committee: 0.30, Subordinate: 0.20 },
  HEAD: { Superior: 0.40, Committee: 0.40, Subordinate: 0.20 },
  STAFF: { Superior: 0.60, Committee: 0.20, Subordinate: 0.20 },
  COMMITTEE: { Superior: 0, Committee: 0, Subordinate: 0 },
};
