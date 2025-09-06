import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import ProposalHeader from '@/components/proposal/ProposalHeader';
import ProposalStatusBanner from '@/components/proposal/ProposalStatusBanner';
import ProposalServices from '@/components/proposal/ProposalServices';
import ProposalActions from '@/components/proposal/ProposalActions';
import ProposalSummary from '@/components/proposal/ProposalSummary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';

const ProposalView = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [proposal, setProposal] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [ownerProfile, setOwnerProfile] = useState(null);

  const fetchProposalAndProfile = useCallback(async () => {
    const { data: proposalData, error: proposalError } = await supabase.from('proposals').select('*').eq('id', id).single();
    if (proposalError) {
      toast({ title: "Error", description: "Propuesta no encontrada.", variant: "destructive" });
      return;
    } 
    
    setProposal(proposalData);
    const initialSelected = proposalData.services?.filter(s => s.selected).map(s => s.id) || [];
    setSelectedServices(proposalData.approved_services || initialSelected);

    if (proposalData.user_id) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('company_info, terms_and_conditions_url, contract_template_url')
        .eq('id', proposalData.user_id)
        .single();
      
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('logo_url')
        .eq('user_id', proposalData.user_id)
        .single();

      if (profileError || settingsError) {
        console.error("Error fetching profile/settings:", profileError || settingsError);
      } else {
        setOwnerProfile({ ...profileData, ...settingsData });
      }
    }
  }, [id, toast]);

  useEffect(() => {
    fetchProposalAndProfile();
  }, [fetchProposalAndProfile]);

  const handleServiceToggle = (serviceId) => {
    if (proposal.status === 'approved' || proposal.status === 'rejected') return;
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const createRelatedRecords = async (approvedProposal) => {
    const approvedServiceDetails = approvedProposal.services.filter(s =>
      approvedProposal.approved_services.includes(s.id)
    );

    const tasksToCreate = approvedServiceDetails
      .filter(service => service.frequency === 'Una vez' || service.frequency === 'Mensual')
      .map(service => ({
        proposal_id: approvedProposal.id,
        service_id: service.id,
        service_name: service.name,
        status: 'Pendiente',
        user_id: approvedProposal.user_id,
        assigned_user_id: approvedProposal.assigned_user_id,
        due_date: new Date().toISOString().split('T')[0],
        is_paid: false
      }));

    if (tasksToCreate.length > 0) {
      const { error } = await supabase.from('tasks').insert(tasksToCreate);
      if (error) {
        toast({
          title: 'Error al crear tareas',
          description: 'La propuesta fue aprobada, pero no se pudieron crear las tareas automáticamente.',
          variant: 'destructive',
        });
      }
    }
    
    const annualServicesToCreate = approvedServiceDetails
      .filter(service => service.frequency === 'Anual')
      .map(service => ({
          user_id: approvedProposal.user_id,
          company_id: approvedProposal.company_id,
          service_name: service.name,
          renewal_month: new Date().getMonth() + 1,
          value: service.price
      }));

    if (annualServicesToCreate.length > 0) {
        const { error } = await supabase.from('annual_services').insert(annualServicesToCreate);
        if (error) {
            toast({
                title: 'Error al crear servicios anuales',
                description: 'No se pudieron registrar los servicios anuales automáticamente.',
                variant: 'destructive',
            });
        }
    }
  };


  const updateProposalStatus = async (status, signatureData, signatureName, signatureEmail) => {
    const selectedServiceDetails = proposal.services.filter(s => selectedServices.includes(s.id));
    const subtotal = selectedServiceDetails.reduce((acc, s) => acc + Number(s.price || 0), 0);
    const discountPercentage = proposal.discount || 0;
    const discountAmount = subtotal * (discountPercentage / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const iva = subtotalAfterDiscount * 0.15;
    const total = subtotalAfterDiscount + iva;
    
    const hasNonAnnualService = selectedServiceDetails.some(s => s.frequency === 'Una vez' || s.frequency === 'Mensual');
    const finalStatus = status === 'approved' && !hasNonAnnualService ? 'completed_annual' : status;

    const updateData = {
      status: finalStatus,
      total,
      approved_services: status === 'approved' ? selectedServices : proposal.approved_services,
      pipeline_stage: status === 'approved' ? 'Aprobado' : 'Rechazado',
      [`${status}_at`]: new Date().toISOString(),
      ...(status === 'approved' && { 
        signature: signatureData,
        client_signature_name: signatureName,
        client_signature_email: signatureEmail
      }),
    };

    const { data: updatedProposal, error } = await supabase.from('proposals').update(updateData).eq('id', id).select().single();
    if (error) {
        toast({ title: 'Error', description: 'No se pudo actualizar la propuesta.' });
    } else {
        if (status === 'approved') {
          await createRelatedRecords({...proposal, ...updatedProposal});
          await supabase.functions.invoke('send-proposal-notification', { body: { proposal_id: updatedProposal.id, event_type: 'proposal_accepted' } });
        }
        fetchProposalAndProfile();
    }
  };
  
  const approveProposal = (signatureData, signatureName, signatureEmail) => {
    updateProposalStatus('approved', signatureData, signatureName, signatureEmail);
    toast({ title: "¡Propuesta aprobada!", description: "Tu aprobación ha sido registrada exitosamente." });
  };

  if (!proposal || !ownerProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
           <div className="loader"></div>
           <p className="text-muted-foreground mt-4">Cargando propuesta...</p>
        </div>
      </div>
    );
  }

  const isFinalState = proposal.status === 'approved' || proposal.status === 'rejected' || proposal.status === 'completed_annual';

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
          <ProposalHeader clientName={proposal.client_name} clientCompany={proposal.client_company} logoUrl={ownerProfile.logo_url} />
          <ProposalStatusBanner status={proposal.status} date={proposal.approved_at || proposal.rejected_at} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {proposal.description && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="bg-white border">
                    <CardHeader><CardTitle className="text-gray-800">Descripción del Proyecto</CardTitle></CardHeader>
                    <CardContent><p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{proposal.description}</p></CardContent>
                  </Card>
                </motion.div>
              )}
              <ProposalServices
                services={proposal.services}
                selectedServices={selectedServices}
                onServiceToggle={handleServiceToggle}
                isApproved={isFinalState}
                isRejected={isFinalState}
              />
              <ProposalActions
                onApprove={approveProposal}
                isApproved={isFinalState}
                isRejected={isFinalState}
                termsUrl={ownerProfile.terms_and_conditions_url}
                contractUrl={ownerProfile.contract_template_url}
              />
            </div>
            <ProposalSummary
              proposal={proposal}
              selectedServices={selectedServices}
              isApproved={isFinalState}
              isRejected={isFinalState}
              logoUrl={ownerProfile.logo_url}
            />
          </div>
      </div>
    </div>
  );
};

export default ProposalView;