import { createServerClient } from './supabase';
import type { User, Criteria, SystemConfig, Exclusion } from './types';

// Helper function to get Supabase client
const getSupabase = () => {
  // Check if env vars are available (skip during build if missing)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  }
  return createServerClient();
};

// ============================================
// Users Helpers
// ============================================
export async function getUsers() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('position', { ascending: true });

  if (error) throw error;

  return data.map((u: any) => ({
    internalId: u.internal_id,
    memberId: u.member_id,
    orgId: u.org_id,
    name: u.name,
    position: u.position,
    salary: u.salary ? Number(u.salary) : null,
    salaryGroup: u.salary_group,
    role: u.role,
    dept: u.dept,
    parentInternalId: u.parent_internal_id,
    img: u.img || (u.member_id 
      ? `https://apps2.coop.ku.ac.th/asset/staff/2568/crop/${u.member_id}.jpg`
      : `https://picsum.photos/seed/${u.org_id}/100/100`),
    isAdmin: u.is_admin || false,
    canViewReport: u.can_view_report || false,
    isActive: u.is_active !== false,
    mobile: u.mobile,
    email: u.email,
    weight: u.weight ? Number(u.weight) : null,
  })) as User[];
}

export async function getUserByOrgId(orgId: number) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('org_id', orgId)
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    internalId: data.internal_id,
    memberId: data.member_id,
    orgId: data.org_id,
    name: data.name,
    role: data.role,
    isAdmin: data.is_admin || false,
  };
}

export async function saveUser(userData: Partial<User>) {
  const supabase = getSupabase();
  
  const dbData: any = {
    internal_id: userData.internalId,
    member_id: userData.memberId || null,
    org_id: userData.orgId,
    name: userData.name,
    position: userData.position,
    dept: userData.dept,
    salary: userData.salary || null,
    salary_group: userData.salaryGroup,
    role: userData.role,
    parent_internal_id: userData.parentInternalId || null,
    img: userData.img || null,
    is_admin: userData.isAdmin || false,
    can_view_report: userData.canViewReport || false,
    is_active: userData.isActive !== false,
    mobile: userData.mobile || null,
    email: userData.email || null,
    weight: userData.weight || null,
  };

  const { data, error } = await supabase
    .from('users')
    .upsert(dbData, { onConflict: 'internal_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUser(internalId: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('internal_id', internalId);

  if (error) throw error;
}

// ============================================
// Criteria Helpers
// ============================================
export async function getCriteria() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('criteria')
    .select('*');

  if (error) throw error;

  return data.map((c: any) => ({
    id: c.id,
    text: c.text,
    category: c.category,
    weight: c.weight,
    description: c.description,
  })) as Criteria[];
}

export async function saveCriteria(criteria: Criteria) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('criteria')
    .upsert({
      id: criteria.id,
      text: criteria.text,
      category: criteria.category,
      weight: criteria.weight,
      description: criteria.description || '',
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCriteria(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('criteria')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// Evaluations Helpers
// ============================================
export async function getEvaluations(evaluatorId?: string, raw?: boolean) {
  const supabase = getSupabase();
  
  let query = supabase.from('evaluations').select('*');
  
  if (evaluatorId) {
    query = query.eq('evaluator_internal_id', evaluatorId);
  }

  const { data, error } = await query;

  if (error) throw error;

  if (raw && !evaluatorId) {
    // Return all scores mapped by Evaluator -> Target -> Criteria
    const allScores: Record<string, Record<string, Record<string, number>>> = {};
    data.forEach((e: any) => {
      if (!allScores[e.evaluator_internal_id]) {
        allScores[e.evaluator_internal_id] = {};
      }
      if (!allScores[e.evaluator_internal_id][e.target_internal_id]) {
        allScores[e.evaluator_internal_id][e.target_internal_id] = {};
      }
      allScores[e.evaluator_internal_id][e.target_internal_id][e.criteria_id] = e.score;
    });
    return { all_scores: allScores };
  } else if (evaluatorId) {
    // Specific evaluator view
    const scores: Record<string, Record<string, number>> = {};
    data
      .filter((e: any) => e.evaluator_internal_id === evaluatorId)
      .forEach((e: any) => {
        if (!scores[e.target_internal_id]) {
          scores[e.target_internal_id] = {};
        }
        scores[e.target_internal_id][e.criteria_id] = e.score;
      });
    return { scores };
  } else {
    // Global view: average scores
    const scores: Record<string, Record<string, number>> = {};
    const evaluatorCounts: Record<string, number> = {};
    
    // Group by target and criteria
    const grouped: Record<string, Record<string, number[]>> = {};
    data.forEach((e: any) => {
      if (!grouped[e.target_internal_id]) {
        grouped[e.target_internal_id] = {};
      }
      if (!grouped[e.target_internal_id][e.criteria_id]) {
        grouped[e.target_internal_id][e.criteria_id] = [];
      }
      grouped[e.target_internal_id][e.criteria_id].push(e.score);
      
      // Count evaluators per target
      if (!evaluatorCounts[e.target_internal_id]) {
        evaluatorCounts[e.target_internal_id] = new Set().size;
      }
    });

    // Calculate averages
    Object.keys(grouped).forEach(targetId => {
      scores[targetId] = {};
      Object.keys(grouped[targetId]).forEach(criteriaId => {
        const scoresList = grouped[targetId][criteriaId];
        const avg = scoresList.reduce((a, b) => a + b, 0) / scoresList.length;
        scores[targetId][criteriaId] = Number(avg.toFixed(2));
      });
      
      // Count unique evaluators
      const uniqueEvaluators = new Set(
        data
          .filter((e: any) => e.target_internal_id === targetId)
          .map((e: any) => e.evaluator_internal_id)
      );
      evaluatorCounts[targetId] = uniqueEvaluators.size;
    });

    return { scores, evaluator_counts: evaluatorCounts };
  }
}

export async function updateScore(
  evaluatorId: string,
  targetId: string,
  criteriaId: string,
  score: number
) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('evaluations')
    .upsert({
      evaluator_internal_id: evaluatorId,
      target_internal_id: targetId,
      criteria_id: criteriaId,
      score: score,
    }, { onConflict: 'evaluator_internal_id,target_internal_id,criteria_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function batchUpdateScores(
  evaluatorId: string,
  updates: Array<{ targetId: string; criteriaId: string; score: number }>
) {
  const supabase = getSupabase();
  
  // Prepare data for batch upsert
  const dataToUpsert = updates.map(update => ({
    evaluator_internal_id: evaluatorId,
    target_internal_id: update.targetId,
    criteria_id: update.criteriaId,
    score: update.score,
  }));

  const { data, error } = await supabase
    .from('evaluations')
    .upsert(dataToUpsert, { 
      onConflict: 'evaluator_internal_id,target_internal_id,criteria_id' 
    })
    .select();

  if (error) throw error;
  return data;
}

// ============================================
// Comments Helpers
// ============================================
export async function getComments(evaluatorId?: string) {
  const supabase = getSupabase();
  
  let query = supabase.from('comments').select('*');

  if (evaluatorId) {
    query = query.eq('evaluator_internal_id', evaluatorId);
  }

  const { data: commentsData, error } = await query;

  if (error) throw error;

  if (evaluatorId) {
    // Singular view: just the comment string
    const comments: Record<string, string> = {};
    commentsData.forEach((c: any) => {
      comments[c.target_internal_id] = c.comment;
    });
    return { comments };
  } else {
    // Report view: array of comment objects with evaluator names
    // Fetch evaluator names separately
    const evaluatorIds = Array.from(new Set(commentsData.map((c: any) => c.evaluator_internal_id)));
    const { data: usersData } = await supabase
      .from('users')
      .select('internal_id, name')
      .in('internal_id', evaluatorIds);

    const userMap = new Map(usersData?.map((u: any) => [u.internal_id, u.name]) || []);

    const comments: Record<string, Array<{ evaluator: string; comment: string }>> = {};
    commentsData.forEach((c: any) => {
      if (!comments[c.target_internal_id]) {
        comments[c.target_internal_id] = [];
      }
      comments[c.target_internal_id].push({
        evaluator: userMap.get(c.evaluator_internal_id) || 'Unknown',
        comment: c.comment,
      });
    });
    return { comments };
  }
}

export async function updateComment(
  evaluatorId: string,
  targetId: string,
  comment: string
) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('comments')
    .upsert({
      evaluator_internal_id: evaluatorId,
      target_internal_id: targetId,
      comment: comment,
    }, { onConflict: 'evaluator_internal_id,target_internal_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// Exclusions Helpers
// ============================================
export async function getExclusions() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('exclusions')
    .select('*');

  if (error) throw error;

  return data.map((ex: any) => ({
    id: ex.id,
    evaluatorId: ex.evaluator_org_id,
    targetId: ex.target_org_id,
    reason: ex.reason || '',
  })) as Exclusion[];
}

export async function addExclusion(
  evaluatorId: number,
  targetId: number,
  reason: string
) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('exclusions')
    .insert({
      evaluator_org_id: evaluatorId,
      target_org_id: targetId,
      reason: reason,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteExclusion(id: number) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('exclusions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// System Config Helpers
// ============================================
export async function getSystemConfig() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('system_config')
    .select('*');

  if (error) throw error;

  const config: any = {};
  data.forEach((row: any) => {
    // Don't send SMTP password
    if (row.key === 'smtp_pass') return;
    
    let val = row.value;
    // Auto-decode JSON fields
    if (val && (val[0] === '{' || val[0] === '[')) {
      try {
        val = JSON.parse(val);
      } catch (e) {
        // Keep as string if not valid JSON
      }
    }
    
    // Map database keys to frontend keys
    if (row.key === 'is_debug') {
      config['isDebug'] = val === 'true' || val === true;
    } else if (row.key === 'start_date') {
      config['startDate'] = val;
    } else if (row.key === 'end_date') {
      config['endDate'] = val;
    } else if (row.key === 'send_email_copy') {
      config['sendEmailCopy'] = val === 'true' || val === true;
    } else if (row.key === 'dept_adjustments') {
      config['deptAdjustment'] = val;
    } else {
      config[row.key] = val;
    }
  });

  return config as Partial<SystemConfig>;
}

export async function updateSystemConfig(config: Partial<SystemConfig>) {
  const supabase = getSupabase();
  
  const updates: Array<{ key: string; value: string }> = [];
  
  Object.entries(config).forEach(([key, value]) => {
    let dbKey = key;
    let dbValue = value;

    // Map frontend keys to database keys
    if (key === 'startDate') dbKey = 'start_date';
    if (key === 'endDate') dbKey = 'end_date';
    if (key === 'isDebug') {
      dbKey = 'is_debug';
      dbValue = (value === true || value === 'true' || String(value) === '1') ? 'true' : 'false';
    }
    if (key === 'smtpHost') dbKey = 'smtp_host';
    if (key === 'smtpPort') dbKey = 'smtp_port';
    if (key === 'smtpUser') dbKey = 'smtp_user';
    if (key === 'smtpPass') {
      dbKey = 'smtp_pass';
      if (!value || value === '••••••••') return; // Skip placeholder
    }
    if (key === 'smtpEncryption') dbKey = 'smtp_encryption';
    if (key === 'sendEmailCopy') {
      dbKey = 'send_email_copy';
      dbValue = (value === true || value === 'true' || String(value) === '1') ? 'true' : 'false';
    }
    if (key === 'deptAdjustment') {
      dbKey = 'dept_adjustments';
      dbValue = JSON.stringify(value, null, 0);
    }

    updates.push({
      key: dbKey,
      value: String(dbValue),
    });
  });

  // Use upsert for each config key
  for (const update of updates) {
    const { error } = await supabase
      .from('system_config')
      .upsert({ key: update.key, value: update.value }, { onConflict: 'key' });
    
    if (error) throw error;
  }
}

// ============================================
// Reset Data
// ============================================
export async function resetData() {
  const supabase = getSupabase();
  
  const { error: evalError } = await supabase
    .from('evaluations')
    .delete()
    .neq('id', 0); // Delete all

  if (evalError) throw evalError;

  const { error: commentError } = await supabase
    .from('comments')
    .delete()
    .neq('id', 0); // Delete all

  if (commentError) throw commentError;

  return { success: true };
}

