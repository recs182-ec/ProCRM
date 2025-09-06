import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Save, Send, Copy, Check, MinusCircle, PlusCircle, Percent } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const CreateProposal = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [openContactPopover, setOpenContactPopover] = useState(false);

  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_company: '',
    description: '',
    services: [],
    contact_id: null,
    company_id: null,
    discount: 0,
  });

  const [showSentDialog, setShowSentDialog] = useState(false);
  const [proposalLink, setProposalLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);


  const fetchContactsAndCompanies = useCallback(async () => {
    if(!user) return;
    const { data: contactsData } = await supabase.from('contacts').select('*, companies(*)').eq('user_id', user.id);
    if(contactsData) setContacts(contactsData);
  }, [user]);

  useEffect(() => {
    fetchContactsAndCompanies();
  }, [fetchContactsAndCompanies]);

  const fetchProposalData = useCallback(async () => {
    if (!user) return;
    
    if (editId) {
      const { data: proposalData, error } = await supabase.from('proposals').select('*, contacts(*, companies(*))').eq('id', editId).single();
      if (proposalData) {
        setFormData({
          client_name: proposalData.client_name,
          client_email: proposalData.client_email,
          client_company: proposalData.client_company || '',
          description: proposalData.description || '',
          services: proposalData.services || [],
          contact_id: proposalData.contact_id,
          company_id: proposalData.company_id,
          discount: proposalData.discount || 0
        });
        if(proposalData.contacts) setSelectedContact(proposalData.contacts);
      }
    } else {
      const { data: servicesData } = await supabase.from('services').select('*').eq('user_id', user.id);
      if (servicesData) {
        setFormData(prev => ({ ...prev, services: servicesData.map(s => ({ ...s, selected: false })) }));
      }
    }
  }, [editId, user]);

  useEffect(() => {
    fetchProposalData();
  }, [fetchProposalData]);

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
    setFormData(prev => ({
      ...prev,
      client_name: contact.name,
      client_email: contact.email,
      client_company: contact.companies?.commercial_name || '',
      contact_id: contact.id,
      company_id: contact.company_id,
    }));
    setOpenContactPopover(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => ({ ...prev, services: prev.services.map(s => s.id === serviceId ? { ...s, selected: !s.selected } : s) }));
  };
  
  const handleServiceUpdate = (serviceId, field, value) => {
    setFormData(prev => ({ ...prev, services: prev.services.map(s => s.id === serviceId ? { ...s, [field]: value } : s)}));
  };

  const addCustomService = () => {
    setFormData(prev => ({...prev, services: [...prev.services, { id: `custom-${Date.now()}`, name: 'Nuevo Servicio', description: '', price: 0, frequency: 'Una vez', selected: true }]}));
  };

  const removeService = (serviceId) => {
    setFormData(prev => ({ ...prev, services: prev.services.filter(service => service.id !== serviceId) }));
  };
  
  const subtotal = formData.services.filter(s => s.selected).reduce((total, s) => total + (parseFloat(s.price) || 0), 0);
  const discountPercentage = parseFloat(formData.discount) || 0;
  const discountAmount = subtotal * (discountPercentage / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const iva = subtotalAfterDiscount * 0.15;
  const total = subtotalAfterDiscount + iva;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(proposalLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const saveProposal = async (status = 'draft') => {
    if (!formData.client_name || !formData.client_email) {
      toast({ title: "Error", description: "Completa los campos de cliente.", variant: "destructive" });
      return;
    }

    const proposalData = {
      ...formData,
      discount: parseFloat(formData.discount) || 0,
      user_id: user.id,
      status,
      total: total,
      pipeline_stage: status === 'sent' ? 'Propuesta Enviada' : 'Calificación',
      assigned_user_id: user.id,
    };
    
    const { data: proposal, error } = editId
      ? await supabase.from('proposals').update(proposalData).eq('id', editId).select().single()
      : await supabase.from('proposals').insert(proposalData).select().single();

    if (error) {
        toast({ title: "Error", description: `No se pudo guardar la propuesta. ${error.message}` });
    } else {
        if (status === 'sent') {
            await supabase.functions.invoke('send-proposal-notification', { body: { proposal_id: proposal.id, event_type: 'new_proposal' } });
            const link = `${window.location.origin}/proposal/${proposal.id}`;
            setProposalLink(link);
            setShowSentDialog(true);
        } else {
            toast({
              title: "Propuesta guardada",
              description: "La propuesta ha sido guardada como borrador.",
            });
            navigate('/pipeline');
        }
    }
  };

  return (
    <div className="w-full">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Link to="/pipeline" className="inline-flex items-center text-primary hover:underline mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Volver al Pipeline</Link>
        <h1 className="text-4xl font-bold text-gray-800">{editId ? 'Editar Propuesta' : 'Nueva Propuesta'}</h1>
        <p className="text-muted-foreground text-lg">Crea una propuesta personalizada para tu cliente</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Información del Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Popover open={openContactPopover} onOpenChange={setOpenContactPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={openContactPopover} className="w-full justify-between">
                    {selectedContact ? `${selectedContact.name} (${selectedContact.companies?.commercial_name || 'Sin compañía'})` : "Buscar contacto para autocompletar..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar contacto..." />
                    <CommandEmpty>No se encontró el contacto.</CommandEmpty>
                    <CommandGroup>
                      {contacts.map((contact) => (
                        <CommandItem key={contact.id} onSelect={() => handleContactSelect(contact)}>
                          {contact.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="client_name">Nombre del Cliente *</Label><Input id="client_name" value={formData.client_name} onChange={(e) => handleInputChange('client_name', e.target.value)} /></div>
                <div><Label htmlFor="client_email">Email *</Label><Input id="client_email" type="email" value={formData.client_email} onChange={(e) => handleInputChange('client_email', e.target.value)} /></div>
              </div>
              <div><Label htmlFor="client_company">Empresa</Label><Input id="client_company" value={formData.client_company} onChange={(e) => handleInputChange('client_company', e.target.value)} /></div>
              <div><Label htmlFor="description">Descripción del Proyecto</Label><Textarea id="description" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} rows={4} /></div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><div className="flex items-center justify-between"><CardTitle>Servicios</CardTitle><Button onClick={addCustomService} variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" />Añadir</Button></div></CardHeader>
            <CardContent className="space-y-4">
              {formData.services.map((service) => (
                <div key={service.id} className={`p-4 rounded-lg border ${service.selected ? 'border-primary' : ''}`}>
                  <div className="flex items-start gap-4">
                    <Checkbox checked={service.selected} onCheckedChange={() => handleServiceToggle(service.id)} className="mt-1" />
                    <div className="flex-1 space-y-2">
                      <Input value={service.name} onChange={(e) => handleServiceUpdate(service.id, 'name', e.target.value)} className="font-semibold" />
                      <Textarea value={service.description} onChange={(e) => handleServiceUpdate(service.id, 'description', e.target.value)} rows={2} />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label>Precio: $</Label><Input type="number" value={service.price} onChange={(e) => handleServiceUpdate(service.id, 'price', e.target.value)} className="w-28" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label>Frecuencia</Label>
                          <Select onValueChange={(value) => handleServiceUpdate(service.id, 'frequency', value)} value={service.frequency}>
                            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Una vez">Una vez</SelectItem>
                              <SelectItem value="Mensual">Mensual</SelectItem>
                              <SelectItem value="Anual">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={() => removeService(service.id)} variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 sticky top-6">
          <Card>
            <CardHeader><CardTitle>Resumen</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Servicios Seleccionados:</h4>
                {formData.services.filter(s => s.selected).map(s => (<div key={s.id} className="flex justify-between text-sm"><span>{s.name}</span><span>${parseFloat(s.price || 0).toLocaleString()}</span></div>))}
                {formData.services.filter(s => s.selected).length === 0 && <p className="text-sm text-muted-foreground">Ningún servicio seleccionado.</p>}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm"><span>Subtotal:</span><span>${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                <div className="flex justify-between items-center text-sm">
                  <Label htmlFor="discount" className="flex items-center gap-1"><MinusCircle className="h-4 w-4 text-red-500" />Descuento (%):</Label>
                  <div className="relative w-24">
                     <Input type="number" id="discount" value={formData.discount} onChange={(e) => handleInputChange('discount', e.target.value)} className="h-8 text-right pr-6" />
                     <Percent className="h-4 w-4 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                 <div className="flex justify-between text-sm"><span>Descuento Aplicado:</span><span>-${discountAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                <div className="flex justify-between text-sm"><div className="flex items-center gap-1"><PlusCircle className="h-4 w-4 text-green-500" /><span>IVA (15%):</span></div><span>${iva.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                <div className="border-t pt-2 mt-2 flex justify-between text-xl font-bold"><span>Total:</span><span className="text-primary">${total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
              </div>

              <div className="space-y-2 pt-4">
                <Button onClick={() => saveProposal('draft')} variant="secondary" className="w-full"><Save className="h-4 w-4 mr-2" />Guardar Borrador</Button>
                <Button onClick={() => saveProposal('sent')} className="w-full"><Send className="h-4 w-4 mr-2" />Guardar y Enviar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
       <Dialog open={showSentDialog} onOpenChange={setShowSentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¡Propuesta Enviada!</DialogTitle>
            <DialogDescription>
              Se ha enviado un correo al cliente. También puedes compartir este enlace para que pueda ver y aprobar la propuesta.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Input value={proposalLink} readOnly />
            <Button onClick={copyToClipboard} size="icon">
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => navigate('/pipeline')}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateProposal;