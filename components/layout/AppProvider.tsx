"use client";
import React, { useState, createContext, useContext, ReactNode, useMemo, useEffect } from 'react';
import type {
  User,
  View,
  ScoreData,
  CommentData,
  Criteria,
  SystemConfig,
  LogEntry,
  Exclusion,
  DeptAdjustment,
  Target,
} from '@/lib/types';
import {
  API_BASE_URL,
  APP_VERSION,
  RECOMMENDED_ADJUSTMENT,
  INITIAL_CRITERIA,
  ROLES,
} from '@/lib/constants';
import { MOCK_DATA, INITIAL_USERS } from '@/lib/data';
import { downloadCSV } from '@/lib/helpers';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  view: View;
  user: User | null;
  currentGroup: string | null;
  currentPerson: Target | null;
  scores: ScoreData;
  comments: CommentData;
  filterType: 'role' | 'salary';
  deptAdjustment: DeptAdjustment;
  criteria: Criteria[];
  getCriteriaForUser: (user: User | Target) => Criteria[];
  systemConfig: SystemConfig;
  logs: LogEntry[];
  exclusions: Exclusion[];
  allUsers: User[];
  login: (user: User) => void;
  logout: () => void;
  navigateToGroup: (group: string) => void;
  navigateToIndividual: (person: Target) => void;
  goBack: () => void;
  updateScore: (personId: string, criteriaId: string, value: number) => void;
  setScores: React.Dispatch<React.SetStateAction<ScoreData>>;
  updateComment: (personId: string, value: string) => void;
  setView: React.Dispatch<React.SetStateAction<View>>;
  setFilterType: React.Dispatch<React.SetStateAction<'role' | 'salary'>>;
  setDeptAdjustment: React.Dispatch<React.SetStateAction<DeptAdjustment>>;
  setCriteria: React.Dispatch<React.SetStateAction<Criteria[]>>;
  setSystemConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;
  addLog: (type: string, message: string) => void;
  setExclusions: React.Dispatch<React.SetStateAction<Exclusion[]>>;
  resetScores: () => void;
  backupData: () => void;
  isLoading: boolean;
  setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
  updateSystemConfig: (config: SystemConfig) => Promise<void>;
  refreshData: (targetUser?: User | null) => Promise<void>;
  fetchReportData: (options?: { raw?: boolean }) => Promise<any>;
  sendEvaluationEmail: (data: any) => Promise<boolean>;
  addExclusion: (evaluatorId: number, targetId: number, reason: string) => Promise<void>;
  removeExclusion: (id: number) => Promise<void>;
  saveUser: (user: Partial<User>) => Promise<void>;
  deleteUser: (internalId: string) => Promise<void>;
  importUsers: (users: User[]) => Promise<void>;
  saveCriteria: (criteria: Criteria) => Promise<void>;
  deleteCriteria: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>('login');
  const [user, setUser] = useState<User | null>(null);
  const [currentGroup, setCurrentGroup] = useState<string | null>(null);
  const [currentPerson, setCurrentPerson] = useState<Target | null>(null);
  const [scores, setScores] = useState<ScoreData>({});
  const [comments, setComments] = useState<CommentData>({});
  const [filterType, setFilterType] = useState<'role' | 'salary'>('role');
  const [deptAdjustment, setDeptAdjustment] = useState<DeptAdjustment>(RECOMMENDED_ADJUSTMENT);
  const [criteria, setCriteria] = useState<Criteria[]>(INITIAL_CRITERIA);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
    sendEmailCopy: false,
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [exclusions, setExclusions] = useState<Exclusion[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const refreshData = async (targetUser?: User | null) => {
    try {
      setIsLoading(true);
      const evaluatorId = targetUser?.internalId || user?.internalId;

      // STRICT ISOLATION: Always filter by evaluator_id for the main context.
      // This ensures the Assessment Table NEVER sees other people's data.
      // Global reports use 'fetchReportData' instead.
      const url = `${API_BASE_URL}/init${evaluatorId ? `?evaluator_id=${evaluatorId}` : ''}`;

      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        let errorMsg = `Failed to fetch initial data (${res.status} ${res.statusText})`;
        const contentType = res.headers.get('content-type');
        
        // Only try to parse JSON if content-type is JSON
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await res.json();
            errorMsg = errorData.error || errorMsg;
          } catch (e) {
            // If JSON parsing fails, use default message
            errorMsg = `API returned non-JSON response (${res.status})`;
          }
        } else {
          // If response is HTML (like Next.js error page), provide a better error message
          errorMsg = `API endpoint returned HTML instead of JSON. This usually means the API route is not found or there's a server error. (${res.status})`;
        }
        throw new Error(errorMsg);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const safeUsers = (data.users || []).map((u: any) => ({
        ...u,
        isAdmin: Boolean(u.isAdmin),
        isActive: u.isActive !== undefined ? Boolean(u.isActive) : true,
        orgId: Number(u.orgId),
        salary: u.salary ? Number(u.salary) : null,
      }));
      setAllUsers(safeUsers);

      if (data.systemConfig) {
        const config = data.systemConfig;
        const mappedConfig: SystemConfig = {
          startDate: config.start_date || config.startDate || systemConfig.startDate,
          endDate: config.end_date || config.endDate || systemConfig.endDate,
          isDebug: config.is_debug === 'true' || config.isDebug === true || false,
          sendEmailCopy: config.send_email_copy === 'true' || config.sendEmailCopy === true,
          smtpHost: config.smtp_host || config.smtpHost,
          smtpPort: config.smtp_port || config.smtpPort,
          smtpUser: config.smtp_user || config.smtpUser,
          smtpPass: config.smtp_pass || config.smtpPass,
          smtpEncryption: config.smtp_encryption || config.smtpEncryption || 'tls',
        };

        setSystemConfig(mappedConfig);

        if (config.dept_adjustments || config.deptAdjustment) {
          setDeptAdjustment(config.dept_adjustments || config.deptAdjustment);
        }
      }

      // Explicitly set or clear data to prevent stale state
      setScores(data.scores || {});
      setComments(data.comments || {});

      if (data.criteria && data.criteria.length > 0) setCriteria(data.criteria);
      if (data.exclusions) setExclusions(data.exclusions);

    } catch (error) {
      console.error("API Error:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to load data from API. Using local backup if available.",
      });
      // Fallback to mock data if API fails to ensure app is usable for demo
      setAllUsers(INITIAL_USERS);
      setExclusions(MOCK_DATA.exclusions.map(e => ({
        id: Math.floor(Math.random() * 1000000),
        evaluatorId: e.evaluator_id,
        targetId: e.target_id,
        reason: e.reason
      })));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReportData = async (options?: { raw?: boolean }) => {
    try {
      let url = `${API_BASE_URL}/init`;
      const params = new URLSearchParams();
      if (options?.raw) {
        params.append('raw', 'true');
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      // No evaluator_id means fetching all data (Global View)
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch report data');
      return await res.json();
    } catch (error) {
      console.error("Report Fetch Error:", error);
      return null;
    }
  };

  const sendEvaluationEmail = async (evaluationData: any) => {
    if (!user) return false;
    try {
      // TODO: Implement email sending API route
      // For now, return false as email functionality needs SMTP setup
      console.warn('Email sending not yet implemented in Supabase migration');
      return false;
      // const res = await fetch(`${API_BASE_URL}/email`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     evaluator_id: user.internalId,
      //     evaluation_data: evaluationData
      //   })
      // });
      // const data = await res.json();
      // if (data.success) {
      //   toast({ title: "Email Sent", description: "สำเนาผลการประเมินถูกส่งไปที่อีเมลของคุณแล้ว" });
      //   return true;
      // } else {
      //   throw new Error(data.error || "Failed to send email");
      // }
    } catch (error: any) {
      console.error("Email Error:", error);
      toast({ variant: "destructive", title: "Email Failed", description: error.message || "ไม่สามารถส่งอีเมลได้" });
      return false;
    }
  };

  useEffect(() => {
    refreshData();
  }, [view]);

  const getCriteriaForUser = (targetUser: User | Target): Criteria[] => {
    // Determine the category based on role
    // Officer roles (Staff) use 'PERF' + 'CHAR' (Officer Characteristics)
    // Executive roles (Manager, Asst, Head) use 'PERF' + 'EXEC' (Executive Characteristics)

    let requiredCategories = ['PERF'];

    if (targetUser.role === ROLES.STAFF) {
      requiredCategories.push('CHAR');
    } else if ([ROLES.HEAD, ROLES.ASST, ROLES.MANAGER].includes(targetUser.role)) {
      requiredCategories.push('EXEC');
    } else {
      return []; // Committee or others involved have no criteria
    }

    return criteria.filter(c => requiredCategories.includes(c.category));
  }

  const addLog = (type: string, message: string) => {
    setLogs(prev => [...prev, { timestamp: new Date().toISOString(), type, message, user: user?.name || 'Guest' }]);
  };

  const login = (u: User) => {
    setUser(u);
    setView('dashboard');
    addLog('LOGIN', `User ${u.name} logged in`);
    toast({ title: 'เข้าสู่ระบบสำเร็จ', description: `ยินดีต้อนรับ, ${u.name}!` });
    refreshData(u);
  };

  const logout = () => {
    addLog('LOGOUT', `User ${user?.name} logged out`);
    setUser(null);
    setView('login');
    toast({ title: 'ออกจากระบบแล้ว', description: 'คุณออกจากระบบเรียบร้อยแล้ว' });
  };

  const navigateToGroup = (g: string) => {
    setCurrentGroup(g);
    setView('evaluation');
  };

  const navigateToIndividual = (p: Target) => {
    const today = new Date().toISOString().split('T')[0];
    const isOutOfTime = today < systemConfig.startDate || today > systemConfig.endDate;

    if (isOutOfTime) {
      toast({
        variant: 'destructive',
        title: 'นอกช่วงเวลาการประเมิน',
        description: 'คุณสามารถดูได้เท่านั้น ไม่สามารถแก้ไขคะแนนได้',
      });
    }

    setCurrentPerson(p);
    setView('individual');
  };

  const goBack = () => {
    if (view === 'evaluation') {
      setCurrentGroup(null);
      setView('dashboard');
    } else if (view === 'individual') {
      setCurrentPerson(null);
      setView('dashboard');
    } else if (view === 'admin' || view === 'summary' || view === 'profile') {
      setView('dashboard');
    } else {
      setView('login');
    }
  };

  const updateScore = async (pId: string, cId: string, val: number) => {
    // Optimistic Update
    setScores(prev => ({ ...prev, [pId]: { ...(prev[pId] || {}), [cId]: val } }));

    if (!user) return;

    try {
      await fetch(`${API_BASE_URL}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluatorId: user.internalId,
          targetId: pId,
          criteriaId: cId,
          score: val
        })
      });
    } catch (error) {
      console.error("Failed to save score", error);
      toast({
        variant: "destructive",
        title: "Save Error",
        description: "Failed to save score to server. Please check connection.",
      });
    }
  };

  const updateComment = async (pId: string, val: string) => {
    // Optimistic Update
    setComments(prev => ({ ...prev, [pId]: val }));

    if (!user) return;

    try {
      await fetch(`${API_BASE_URL}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluatorId: user.internalId,
          targetId: pId,
          comment: val
        })
      });
    } catch (error) {
      console.error("Failed to save comment", error);
      toast({
        variant: "destructive",
        title: "Save Error",
        description: "Failed to save comment to server.",
      });
    }
  };

  const updateSystemConfig = async (newConfig: SystemConfig) => {
    setSystemConfig(newConfig); // Optimistic

    try {
      const configToSave = { ...newConfig, deptAdjustment: newConfig.deptAdjustment || deptAdjustment };
      await fetch(`${API_BASE_URL}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configToSave)
      });
      addLog('ADMIN', 'Updated system configuration');
      toast({ title: "บันทึกการตั้งค่าแล้ว", description: "ข้อมูลช่วงเวลาการประเมินถูกอัปเดตเรียบร้อย" });
    } catch (error) {
      console.error("Config update failed", error);
      toast({ variant: 'destructive', title: 'Save Error', description: 'Failed to save config to server' });
    }
  };

  const addExclusion = async (evaluatorId: number, targetId: number, reason: string) => {
    // Optimistic
    const tempId = Date.now();
    const newEx = { id: tempId, evaluatorId, targetId, reason };
    setExclusions(prev => [...prev, newEx]);

    try {
      const res = await fetch(`${API_BASE_URL}/exclusions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluatorId, targetId, reason })
      });
      const data = await res.json();
      if (data.success && data.id) {
        // Update ID with real ID from DB
        setExclusions(prev => prev.map(ex => ex.id === tempId ? { ...ex, id: data.id } : ex));
        toast({ title: "เพิ่มข้อยกเว้นแล้ว" });
      }
    } catch (error) {
      console.error("Failed to add exclusion", error);
      setExclusions(prev => prev.filter(ex => ex.id !== tempId)); // Revert
      toast({ variant: 'destructive', title: "Error", description: "Failed to add exclusion" });
    }
  };

  const removeExclusion = async (id: number) => {
    // Optimistic
    const prevExclusions = [...exclusions];
    setExclusions(prev => prev.filter(ex => ex.id !== id));

    try {
      await fetch(`${API_BASE_URL}/exclusions?id=${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      toast({ title: "ลบข้อยกเว้นแล้ว" });
    } catch (error) {
      console.error("Failed to delete exclusion", error);
      setExclusions(prevExclusions); // Revert
      toast({ variant: 'destructive', title: "Error", description: "Failed to delete exclusion" });
    }
  };

  const saveUser = async (userData: Partial<User>) => {
    // Optimistic update handled by caller usually, but for complex logic we might re-fetch
    // Here we will just call API and refresh data or let caller handle local state update
    // Best pattern: Call API -> if success -> caller updates local state or we re-fetch

    // For now, let's just make the API call. The caller (AdminUserManagement) will handle local state optimistically or re-fetch.

    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
    } catch (error) {
      console.error("Failed to save user", error);
      throw error; // Let component handle error UI
    }
  };

  const deleteUser = async (internalId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users?internalId=${encodeURIComponent(internalId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
    } catch (error) {
      console.error("Failed to delete user", error);
      throw error;
    }
  };

  const importUsers = async (newUsers: User[]) => {
    try {
      // Import users one by one or in batch
      for (const userData of newUsers) {
        const res = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      // Don't return value - type definition expects Promise<void>
    } catch (error) {
      console.error("Failed to import users", error);
      throw error;
    }
  };


  const resetScores = async () => {
    try {
      setScores({});
      setComments({});
      await fetch(`${API_BASE_URL}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      addLog('ADMIN', 'Reset all scores and comments');
      toast({ title: 'รีเซ็ตข้อมูลแล้ว', description: 'คะแนนและความคิดเห็นทั้งหมดถูกล้างแล้ว' });
    } catch (error) {
      console.error("Reset failed", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to reset data on server' });
    }
  };

  const saveCriteria = async (newCriteria: Criteria) => {
    // Optimistic
    setCriteria(prev => {
      const index = prev.findIndex(c => c.id === newCriteria.id);
      if (index > -1) {
        const updated = [...prev];
        updated[index] = newCriteria;
        return updated;
      } else {
        return [...prev, newCriteria];
      }
    });

    try {
      const res = await fetch(`${API_BASE_URL}/criteria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCriteria)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: "บันทึกหลักเกณฑ์แล้ว" });
    } catch (error) {
      console.error("Failed to save criteria", error);
      toast({ variant: 'destructive', title: "Error", description: "Failed to save criteria" });
    }
  };

  const deleteCriteria = async (id: string) => {
    // Optimistic
    setCriteria(prev => prev.filter(c => c.id !== id));

    try {
      const res = await fetch(`${API_BASE_URL}/criteria?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: "ลบหลักเกณฑ์แล้ว" });
    } catch (error) {
      console.error("Failed to delete criteria", error);
      toast({ variant: 'destructive', title: "Error", description: "Failed to delete criteria" });
    }
  };



  const backupData = () => {
    try {
      const backupObject = {
        version: APP_VERSION,
        timestamp: new Date().toISOString(),
        scores,
        comments,
        logs,
        allUsers,
        systemConfig,
        deptAdjustment,
        criteria,
        exclusions
      };
      const dataStr = JSON.stringify(backupObject, null, 2);
      downloadCSV(`assessai_backup_${new Date().toISOString().slice(0, 10)}.json`, dataStr);
      addLog('ADMIN', 'Backed up system data');
      toast({ title: 'สำรองข้อมูลสำเร็จ', description: 'ไฟล์สำรองข้อมูล JSON ถูกดาวน์โหลดแล้ว' });
    } catch (error) {
      addLog('ERROR', 'Backup failed');
      toast({ variant: 'destructive', title: 'การสำรองข้อมูลล้มเหลว', description: 'ไม่สามารถสร้างไฟล์สำรองข้อมูลได้' });
    }
  };

  const value = {
    view,
    user,
    currentGroup,
    currentPerson,
    scores,
    comments,
    filterType,
    deptAdjustment,
    criteria,
    getCriteriaForUser,
    systemConfig,
    logs,
    exclusions,
    allUsers,
    login,
    logout,
    navigateToGroup,
    navigateToIndividual,
    goBack,
    updateScore,
    setScores,
    updateComment,
    setView,
    setFilterType,
    setDeptAdjustment,
    setCriteria,
    setSystemConfig,
    addLog,
    setExclusions,
    resetScores,
    backupData,
    setAllUsers,
    isLoading,
    updateSystemConfig,
    refreshData,
    fetchReportData,
    sendEvaluationEmail,
    addExclusion,
    removeExclusion,
    saveUser,
    deleteUser,
    importUsers,
    saveCriteria,
    deleteCriteria,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
