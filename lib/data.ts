import type { User } from './types';
import { calculateSalaryGroup, getRoleFromPosition, generateInternalId, getAvatar } from './helpers';

export const MOCK_DATA = {
  "organization": [
    {
      "position": "คณะกรรมการบริหาร",
      "id": 999,
      "name": "ท่านประธาน",
      "dept": "คณะกรรมการ",
      "salary": null,
      "children": []
    },
    {
      "id": 21,
      "name": "ปิยธิดา แย้มเกษร",
      "position": "ผู้จัดการ",
      "dept": "ผู้จัดการ",
      "salary": 120000,
      "isAdmin": true,
      "canViewReport": true,
      "children": [
        {
          "position": "หัวหน้าบัญชี",
          "id": 26,
          "name": "ธัญญ์ศริน วราชุน",
          "dept": "บัญชี",
          "salary": 48000,
          "children": [
            { "position": "เจ้าหน้าที่", "ids": [47, 57], "names": ["ขวัญฤทัย จิตรบำรุง", "พุทธวรรณ จิตตประกอบ"], "salaries": [28000, 18000] }
          ]
        },
        {
          "position": "ผู้ช่วยการเงิน",
          "id": 23,
          "name": "ณัฏฐเวช เศรษฐศิโรตม์",
          "dept": "การเงินและลงทุน",
          "salary": 85000,
          "children": [
            { "position": "เจ้าหน้าที่", "id": 53, "name": "ปฐมพงศ์ ใจช่วย", "salary": 35000 },
            {
              "position": "ส่วนงานการเงินและลงทุน", "isSection": true,
              "children": [
                {
                  "position": "หัวหน้า", "id": 22, "name": "พรชนัน สมบูรณ์สวัสดิ์", "salary": 45000, "children": [
                    { "position": "เจ้าหน้าที่", "ids": [59, 65, 51, 25], "names": ["จิราพร ศรีวิชัย", "ณฏฐณิชา อ่อนบาง", "ณิชชา ไชยะกาล", "วรพร ปั้นรัตน์"], "salaries": [19000, 19500, 25000, 38000] }
                  ]
                }
              ]
            }
          ]
        },
        {
          "position": "ผู้ช่วยไอที", "id": 19, "name": "เกียรติณรงค์ ถนอมทรัพย์", "dept": "ไอที", "salary": 90000, "isAdmin": true,
          "children": [
            {
              "position": "ส่วนงานเทคโนโลยีสารสนเทศ", "isSection": true, "children": [
                {
                  "position": "หัวหน้า", "id": 29, "name": "สมัย เสริฐเจิม", "salary": 85000, "isAdmin": true, "children": [
                    { "position": "เจ้าหน้าที่", "ids": [62, 48], "names": ["กัณหา งิ้วออก", "ตุลภัทร จัตุสุนทรกุล"], "salaries": [29000, 39000], "isAdmins": [true, false] }
                  ]
                }
              ]
            }
          ]
        },
        {
          "position": "รองผู้จัดการ", "id": 13, "name": "อุราพร พิมพ์ทอง", "dept": "รองผู้จัดการ", "salary": 95000,
          "children": [
            {
              "position": "ส่วนงานสินเชื่อและกำแพงแสน", "dept": "สินเชื่อและกำแพงแสน", "isSection": true, "children": [
                {
                  "position": "ผู้ช่วยผู้จัดการ", "id": 11, "name": "ธัญญา ศักดิ์กะทัศน์", "salary": 88000, "children": [
                    {
                      "position": "หัวหน้า", "id": 17, "name": "อรพรรณ โสภณธนะสิริ", "salary": 49000, "children": [
                        { "position": "เจ้าหน้าที่", "ids": [58, 8], "names": ["ณัฐชยา ทินกูล", "ธมนวรรณ แสงจันทร์"], "salaries": [15000, 60000] }
                      ]
                    },
                    {
                      "position": "หัวหน้า", "id": 16, "name": "ชวาลา บุญจันทร์", "salary": 75000, "children": [
                        { "position": "เจ้าหน้าที่", "ids": [37, 63, 60, 41], "names": ["ธมลวรรณ นาคสกุล", "วรินทร์ธร เพิ่มศิริคณาชัย", "ธนาเทพ พุทธา", "พงษ์ศักดิ์ สิทธิภาพ"], "salaries": [39000, 16000, 17000, 33000] }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              "position": "ส่วนงานอำนวยการ", "dept": "บริหารทั่วไป", "isSection": true, "children": [
                {
                  "position": "ผู้ช่วยผู้จัดการ", "id": 49, "name": "สุชญา อรุณินทร์", "salary": 82000, "children": [
                    {
                      "position": "หัวหน้า", "id": 14, "name": "สดใส ศรีเจริญสุข", "salary": 78000, "children": [
                        { "position": "เจ้าหน้าที่", "ids": [18, 56, 64, 31, 61, 38, 32, 50], "names": ["สุภาพร วงษ์สกุล", "ชนิกานต์ จีระสมบัติ", "ณัชชา ล้อมวงค์", "พรพิมล เสาะด้น", "พัทรดา วาณิชย์ราบรื่น", "วชิราพร ไชยพงศ์", "ศศิภา เพชรกรรพุม", "พรภิชัย ทะวงศ์"], "salaries": [41000, 12000, 13000, 31000, 14000, 34000, 36000, 24000] }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "exclusions": [
    { "evaluator_id": 53, "target_id": 22, "reason": "ปฐมพงศ์ ไม่ต้องประเมิน พรชนัน" },
    { "evaluator_id": 58, "target_id": 16, "reason": "ณัฐชยา ข้าม ชวาลา" },
    { "evaluator_id": 8, "target_id": 16, "reason": "ธมนวรรณ ข้าม ชวาลา" },
    { "evaluator_id": 37, "target_id": 17, "reason": "ธมลวรรณ ข้าม อรพรรณ" },
    { "evaluator_id": 63, "target_id": 17, "reason": "วรินทร์ธร ข้าม อรพรรณ" },
    { "evaluator_id": 60, "target_id": 17, "reason": "ธนาเทพ ข้าม อรพรรณ" },
    { "evaluator_id": 41, "target_id": 17, "reason": "พงษ์ศักดิ์ ข้าม อรพรรณ" },
    { "evaluator_id": 22, "target_id": 53, "reason": "พรชนัน ข้าม ปฐมพงศ์" },
    { "evaluator_id": 16, "target_id": 58, "reason": "ชวาลา ข้าม ณัฐชยา" },
    { "evaluator_id": 16, "target_id": 8, "reason": "ชวาลา ข้าม ธมนวรรณ" },
    { "evaluator_id": 17, "target_id": 49, "reason": "อรพรรณ ข้าม สุชญา" },
    { "evaluator_id": 17, "target_id": 19, "reason": "อรพรรณ ข้าม เกียรติณรงค์" },
    { "evaluator_id": 17, "target_id": 23, "reason": "อรพรรณ ข้าม ณัฏฐเวช" }
  ]
};

const parseOrgChart = (node: any, parentInternalId: string | null = null, currentDept = 'ส่วนกลาง'): User[] => {
  let users: User[] = [];
  let myInternalId: string | null = null;
  let myDept = node.dept || currentDept;

  const defaultPermissions = {
    canManageUsers: false,
    canManageCriteria: false,
    canManageAdjustments: false,
    canUseAITool: false,
    canManageSystem: false,
  };

  if (node.isSection) {
    if (node.children) {
      node.children.forEach((child: any) => {
        users = [...users, ...parseOrgChart(child, parentInternalId, myDept)];
      });
    }
    return users;
  }

  if (node.ids && node.names) {
    node.names.forEach((name: string, index: number) => {
      const userSalary = node.salaries ? node.salaries[index] : null;
      const orgId = node.ids[index];
      const isAdmin = node.isAdmins ? node.isAdmins[index] : false;
      users.push({
        internalId: generateInternalId(),
        orgId: orgId,
        name: name,
        position: node.position,
        salary: userSalary,
        salaryGroup: calculateSalaryGroup(userSalary),
        role: getRoleFromPosition(node.position),
        dept: myDept,
        parentInternalId: parentInternalId,
        img: getAvatar(orgId),
        isAdmin: isAdmin,
        canViewReport: node.canViewReports ? node.canViewReports[index] : false,
        isActive: true,
        permissions: { ...defaultPermissions, canViewReport: node.canViewReport || false }
      });
    });
  } else if (node.name) {
    myInternalId = generateInternalId();
    const isAdmin = node.isAdmin || false;
    const canViewReport = node.canViewReport || false;
    users.push({
      internalId: myInternalId,
      orgId: node.id,
      name: node.name,
      position: node.position,
      salary: node.salary,
      salaryGroup: calculateSalaryGroup(node.salary),
      role: getRoleFromPosition(node.position),
      dept: myDept,
      parentInternalId: parentInternalId,
      img: getAvatar(node.id),
      isAdmin: isAdmin,
      canViewReport: canViewReport,
      isActive: true,
      permissions: { ...defaultPermissions, canViewReport: canViewReport }
    });
  }

  const nextParentInternalId = myInternalId || parentInternalId;

  if (node.children) {
    node.children.forEach((child: any) => {
      users = [...users, ...parseOrgChart(child, nextParentInternalId, myDept)];
    });
  }

  return users;
};

export const INITIAL_USERS: User[] = MOCK_DATA.organization.flatMap(rootNode => parseOrgChart(rootNode));
