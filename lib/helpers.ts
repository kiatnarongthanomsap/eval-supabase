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
    // @ts-ignore - Handle both potential cases if legacy data exists, but prioritize camelCase
    (ex.evaluatorId === evaluatorOrgId || ex.evaluator_id === evaluatorOrgId) &&
    (ex.targetId === targetOrgId || ex.target_id === targetOrgId)
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
      [ROLES.MANAGER, ROLES.ASST].includes(u.role) && u.orgId !== currentUser.orgId && u.isActive
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

// --- 5. Advanced Calculation Logic ---
export function calculateFinalWeightedScore(
  target: User,
  allRawScores: { [evaluatorId: string]: { [targetId: string]: { [criteriaId: string]: number } } },
  allUsers: User[],
  criteria: Criteria[],
  evaluatorWeightsTable: any,
  categoryWeights: any,
  exclusions: Exclusion[]
): number {
  // 1. Identify all evaluators for this target and their relationships
  const evaluatorGroups: { [key in 'Superior' | 'Committee' | 'Subordinate']: string[] } = {
    Superior: [],
    Committee: [],
    Subordinate: []
  };

  allUsers.forEach(u => {
    if (u.internalId === target.internalId) return;

    const targetsForThisUser = findTargets(u, allUsers, exclusions);
    const targetMatch = targetsForThisUser.find(t => t.internalId === target.internalId);

    if (targetMatch) {
      if (targetMatch.type.includes('Performance (Down)')) {
        evaluatorGroups.Superior.push(u.internalId);
      } else if (targetMatch.type.includes('Performance (Committee)')) {
        evaluatorGroups.Committee.push(u.internalId);
      } else if (targetMatch.type.includes('Feedback (Up')) {
        evaluatorGroups.Subordinate.push(u.internalId);
      }
    }
  });

  // 2. Calculate average score for each group using 60:40 rule
  const groupScores: { [key in 'Superior' | 'Committee' | 'Subordinate']: number } = {
    Superior: 0,
    Committee: 0,
    Subordinate: 0
  };

  const groupWeights = evaluatorWeightsTable[target.role] || { Superior: 0, Committee: 0, Subordinate: 0 };

  (Object.keys(evaluatorGroups) as Array<'Superior' | 'Committee' | 'Subordinate'>).forEach(groupName => {
    const evaluatorIds = evaluatorGroups[groupName];
    if (evaluatorIds.length === 0) return;

    let groupTotal = 0;
    let actualEvaluatorsCount = 0;

    evaluatorIds.forEach(eid => {
      const myScoresForTarget = allRawScores[eid]?.[target.internalId];
      if (!myScoresForTarget) return;

      const part1Criteria = criteria.filter(c => c.category === 'PERF');
      const part2Criteria = criteria.filter(c => c.category === 'CHAR' || c.category === 'EXEC');

      const calculatePartScore = (partCriteria: Criteria[]) => {
        if (partCriteria.length === 0) return 0;
        let partSum = 0;
        let partWeightSum = 0;
        let filledCount = 0;
        partCriteria.forEach(c => {
          const score = myScoresForTarget[c.id];
          if (score) {
            partSum += (score / 4) * c.weight;
            partWeightSum += c.weight;
            filledCount++;
          }
        });
        if (filledCount === 0 || partWeightSum === 0) return 0;
        return (partSum / partWeightSum) * 100;
      };

      const p1 = calculatePartScore(part1Criteria);
      const p2 = calculatePartScore(part2Criteria);

      const finalEvalScore = (p1 * (categoryWeights.PERF || 0.6)) + (p2 * (categoryWeights.CHAR || categoryWeights.EXEC || 0.4));
      groupTotal += finalEvalScore;
      actualEvaluatorsCount++;
    });

    if (actualEvaluatorsCount > 0) {
      groupScores[groupName] = groupTotal / actualEvaluatorsCount;
    }
  });

  // 3. Apply Group Weights with normalization for missing groups
  let totalWeightedScore = 0;
  let activeWeightSum = 0;

  (Object.keys(groupScores) as Array<'Superior' | 'Committee' | 'Subordinate'>).forEach(groupName => {
    const weight = groupWeights[groupName];
    if (weight > 0 && groupScores[groupName] > 0) {
      totalWeightedScore += groupScores[groupName] * weight;
      activeWeightSum += weight;
    }
  });

  if (activeWeightSum === 0) return 0;
  return totalWeightedScore / activeWeightSum;
}

export function calculateTotal(personInternalId: string, scores: any, criteria: Criteria[]): number {
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

  return (totalScore / totalWeight) * 100;
};
