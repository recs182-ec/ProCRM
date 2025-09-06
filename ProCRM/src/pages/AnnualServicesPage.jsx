import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const AnnualServicesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [annualServices, setAnnualServices] = useState({});
  const [companies, setCompanies] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ company_id: '', service_name: '', renewal_month: '', value: 0 });

  const fetchServices = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('annual_services').select('*, companies(commercial_name)').eq('user_id', user.id);
    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los servicios anuales.', variant: 'destructive' });
      return;
    }
    const groupedServices = data.reduce((acc, service) => {
      const month = service.renewal_month;
      if (!acc[month]) acc[month] = [];
      acc[month].push(service);
      return acc;
    }, {});
    setAnnualServices(groupedServices);
  }, [user, toast]);

  const fetchCompanies = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('companies').select('id, commercial_name').eq('user_id', user.id);
    setCompanies(data || []);
  }, [user]);

  useEffect(() => {
    fetchServices();
    fetchCompanies();
  }, [fetchServices, fetchCompanies]);

  const handleSave = async () => {
    if (!formData.company_id || !formData.service_name || !formData.renewal_month) {
      toast({ title: 'Error', description: 'Todos los campos son requeridos.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('annual_services').insert({ ...formData, user_id: user.id });
    if (error) {
      toast({ title: 'Error', description: 'No se pudo guardar el servicio.', variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: 'Servicio anual guardado.' });
      fetchServices();
      setIsDialogOpen(false);
    }
  };
  
  const handleDelete = async (id) => {
    const { error } = await supabase.from('annual_services').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el servicio.', variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: 'Servicio eliminado.' });
      fetchServices();
    }
  };

  return (
    <div className="w-full">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Servicios Anuales</h1>
          <p className="text-muted-foreground text-lg">Calendario de renovaciones de servicios anuales.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Añadir Servicio</Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {months.map((month, index) => (
          <Card key={month}>
            <CardHeader>
              <CardTitle>{month}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(annualServices[index + 1] || []).map(service => (
                <div key={service.id} className="p-3 rounded-md bg-secondary flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{service.companies.commercial_name}</p>
                    <p className="text-sm text-muted-foreground">{service.service_name}</p>
                    <p className="text-sm font-bold text-primary">${(service.value || 0).toLocaleString()}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => handleDelete(service.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(!annualServices[index + 1] || annualServices[index + 1].length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Sin renovaciones</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Servicio Anual</DialogTitle>
            <DialogDescription>Registra un nuevo servicio para renovación anual.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Compañía</Label>
              <Select onValueChange={value => setFormData(prev => ({ ...prev, company_id: value }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar compañía" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.commercial_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nombre del Servicio</Label>
              <Input value={formData.service_name} onChange={e => setFormData(prev => ({ ...prev, service_name: e.target.value }))} placeholder="Ej: Hosting Anual"/>
            </div>
            <div>
              <Label>Valor ($)</Label>
              <Input type="number" value={formData.value} onChange={e => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))} placeholder="0.00"/>
            </div>
            <div>
              <Label>Mes de Renovación</Label>
              <Select onValueChange={value => setFormData(prev => ({ ...prev, renewal_month: value }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar mes" /></SelectTrigger>
                <SelectContent>
                  {months.map((m, i) => <SelectItem key={m} value={i + 1}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnnualServicesPage;