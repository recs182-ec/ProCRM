
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import MainLayout from '@/components/layout/MainLayout';
import AdminDashboard from '@/pages/AdminDashboard';
import ProposalView from '@/pages/ProposalView';
import CreateProposal from '@/pages/CreateProposal';
import PipelinePage from '@/pages/pipeline/PipelinePage';
import Companies from '@/pages/crm/Companies';
import Contacts from '@/pages/crm/Contacts';
import Services from '@/pages/crm/Services';
import Leads from '@/pages/crm/Leads';
import LoginPage from '@/pages/auth/LoginPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SettingsPage from '@/pages/settings/SettingsPage';
import ApprovedJobsPage from '@/pages/ApprovedJobsPage';
import AnnualServicesPage from '@/pages/AnnualServicesPage';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import ProposalsPage from '@/pages/ProposalsPage';

function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>CRM & Propuestas</title>
        <meta name="description" content="Plataforma profesional para crear, gestionar y aprobar propuestas de servicios, y administrar tu CRM de manera eficiente." />
        <meta property="og:title" content="CRM & Propuestas" />
        <meta property="og:description" content="Plataforma profesional para crear, gestionar y aprobar propuestas de servicios, y administrar tu CRM de manera eficiente." />
      </Helmet>
      
      <Router>
        <Routes>
          <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/dashboard" />} />
          <Route path="/signup" element={!session ? <SignUpPage /> : <Navigate to="/dashboard" />} />
          <Route path="/proposal/:id" element={<ProposalView />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<AdminDashboard />} />
              <Route path="/create" element={<CreateProposal />} />
              <Route path="/proposals" element={<ProposalsPage />} />
              <Route path="/pipeline" element={<PipelinePage />} />
              <Route path="/jobs" element={<ApprovedJobsPage />} />
              <Route path="/annual-services" element={<AnnualServicesPage />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/services" element={<Services />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
