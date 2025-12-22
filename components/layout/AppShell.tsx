"use client";

import { useAppContext } from "@/components/layout/AppProvider";
import LoginPage from "@/components/auth/LoginPage";
import AssessmentPage from "@/components/assessment/AssessmentPage";
import AdminDashboard from "@/components/admin/AdminDashboard";
import EvaluationTable from "@/components/assessment/EvaluationTable";
import IndividualEvaluation from "@/components/assessment/IndividualEvaluation";
import SummaryPage from "@/components/reports/SummaryPage";
import ProfilePage from "@/components/profile/ProfilePage";
import ProgressPage from "@/components/reports/ProgressPage";

export default function AppShell() {
  const { view } = useAppContext();

  const renderView = () => {
    switch (view) {
      case "login":
        return <LoginPage />;
      case "dashboard":
        return <AssessmentPage />;
      case "admin":
        return <AdminDashboard />;
      case "evaluation":
        return <EvaluationTable />;
      case "individual":
        return <IndividualEvaluation />;
      case "summary":
        return <SummaryPage />;
      case "profile":
        return <ProfilePage />;
      case "progress":
        return <ProgressPage />;
      default:
        return <LoginPage />;
    }
  };

  return <main>{renderView()}</main>;
}
