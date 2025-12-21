import type { User, Exclusion, Role, Target, Criteria, ScoreData } from './types';
import { ROLES } from './constants';

// --- 2. Helper Functions ---
export const calculateSalaryGroup = (salary: number | null | undefined): string => {
  if (salary === null || salary === undefined) return 'ไม่จัดกลุ่ม';
  const s = parseInt(String(salary));
  if (s > 100000) return 'เกิน 100,000';
  if (s > 50000) return 'เกิน 50,000';
  if (s > 40000) return 'เกิน 40,000';
  if (s > 30000) return 'เกิน 30,000';
  if (s > 20000) return 'เกิน 20,000';
  return 'ไม่เกิน 20,000';
};

export const formatSalaryGroup = (group: string | null | undefined): string => {
  if (!group || group === 'N/A' || group === 'ไม่จัดกลุ่ม') return '-';
  const match = group.match(/^([A-Z0-9]+)\./);
  return match ? `Gr.${match[1]}` : group;
};

export const getRoleFromPosition = (pos: string | null | undefined): Role => {
  if (!pos) return ROLES.STAFF as Role;
  if (pos.includes('กรรมการ')) return ROLES.COMMITTEE as Role;
  if (pos.includes('ผู้จัดการ') && !pos.includes('ผู้ช่วย') && !pos.includes('รอง')) return ROLES.MANAGER as Role;
  if (pos.includes('รอง') || pos.includes('ผู้ช่วย')) return ROLES.ASST as Role;
  if (pos.includes('หัวหน้า')) return ROLES.HEAD as Role;
  return ROLES.STAFF as Role;
};

export const getScoreLevel = (score: number) => {
  if (score >= 90) return { label: 'ดีมาก', color: 'text-emerald-700 bg-emerald-100 border-emerald-200' };
  if (score >= 75) return { label: 'ดี', color: 'text-blue-700 bg-blue-100 border-blue-200' };
  if (score >= 60) return { label: 'พอใช้', color: 'text-orange-700 bg-orange-100 border-orange-200' };
  return { label: 'ปรับปรุง', color: 'text-red-700 bg-red-100 border-red-200' };
};

export const downloadCSV = (filename: string, content: string) => {
    const BOM = "\uFEFF";
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(BOM + content);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

let internalIdCounter = 1;
export const generateInternalId = () => `U_${Date.now()}_${internalIdCounter++}`;

export const getAvatar = (seed: string | number) => `https://picsum.photos/seed/${seed}/100/100`;

// --- 4. Logic Functions ---
export const isExcluded = (evaluatorOrgId: number, targetOrgId: number, exclusionsList: Exclusion[]): boolean => {
  return exclusionsList.some(ex =>
    ex.evaluator_id === evaluatorOrgId && ex.target_id === targetOrgId
  );
};

export const findTargets = (currentUser: User | null, usersList: User[], exclusionsList: Exclusion[]): Target[] => {
  if (!currentUser) return [];

  let targets: Target[] = [];

  const getDescendants = (parentId: string) => {
    const children = usersList.filter(u => u.parentInternalId === parentId);
    children.forEach(child => {
      if (child.isActive) {
        targets.push({ ...child, type: 'Performance (Down)' });
        getDescendants(child.internalId);
      }
    });
  };

  const getAncestors = (startUser: User) => {
    let currentParentId = startUser.parentInternalId;
    while (currentParentId) {
      const parent = usersList.find(u => u.internalId === currentParentId);
      if (parent && parent.isActive) {
        targets.push({ ...parent, type: 'Feedback (Up - 20%)' });
        currentParentId = parent.parentInternalId;
      } else {
        break;
      }
    }
  };

  if (currentUser.role === ROLES.COMMITTEE) {
    const eligibleTargets = usersList.filter(u =>
      [ROLES.MANAGER, ROLES.ASST, ROLES.HEAD].includes(u.role) && u.orgId !== currentUser.orgId && u.isActive
    );
    eligibleTargets.forEach(u => {
      targets.push({ ...u, type: 'Performance (Committee)' });
    });
  }
  else {
    if ([ROLES.MANAGER, ROLES.ASST, ROLES.HEAD].includes(currentUser.role)) {
      getDescendants(currentUser.internalId);
    }
    if ([ROLES.ASST, ROLES.HEAD, ROLES.STAFF].includes(currentUser.role)) {
      getAncestors(currentUser);
    }
  }

  return targets.filter(target => {
    return !isExcluded(currentUser.orgId, target.orgId, exclusionsList);
  });
};

export function calculateTotal(personInternalId: string, scores: ScoreData, criteria: Criteria[]): number {
    const personScores = scores[personInternalId] || {};
    let totalScore = 0;
    let totalWeight = 0;
    let allCriteriaScored = criteria.length > 0 && criteria.every(c => personScores[c.id] > 0);

    if (!allCriteriaScored) return 0;

    criteria.forEach(c => {
        const score = personScores[c.id];
        if (score !== undefined && score > 0) {
            totalScore += (score / 4) * c.weight;
        }
        totalWeight += c.weight;
    });

    if (totalWeight === 0) return 0;
    
    // Normalize to 100
    return (totalScore / totalWeight) * 100;
};
