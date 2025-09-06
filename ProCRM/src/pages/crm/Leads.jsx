
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, UserCheck, Trash2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Leads = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', source: '', notes: '' });
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from('leads').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los leads.', variant: 'destructive' });
    } else {
      setLeads(data);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast({ title: 'Error', description: 'Nombre y email son obligatorios.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('leads').insert({ ...formData, user_id: user.id, pipeline_stage: 'Leads o Prospectos' });
    if (error) {
      toast({ title: 'Error', description: 'No se pudo añadir el lead.', variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: 'Lead añadido exitosamente.' });
      fetchLeads();
    }
    setIsDialogOpen(false);
  };
  
  const handleAddNew = () => {
    setFormData({ name: '', email: '', source: '', notes: '' });
    setIsDialogOpen(true);
  }

  const handleDelete = async (id) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el lead.', variant: 'destructive' });
    } else {
      toast({ title: 'Lead eliminado', description: 'El lead ha sido eliminado.' });
      fetchLeads();
    }
  };
  
  const convertToContact = async (lead) => {
    const { error: contactError } = await supabase.from('contacts').insert({ name: lead.name, email: lead.email, user_id: user.id });
    if (contactError) {
      toast({ title: 'Error', description: 'No se pudo convertir el lead a contacto.', variant: 'destructive' });
      return;
    }
    await supabase.from('leads').delete().eq('id', lead.id);
    fetchLeads();
    toast({ title: '¡Convertido!', description: `${lead.name} ahora es un contacto.` });
  };
  
  return (
    <div className="w-full">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Leads</h1>
          <p className="text-muted-foreground text-lg">Captura y gestiona tus clientes potenciales.</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" /> Añadir Lead
        </Button>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Añadir Nuevo Lead</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label htmlFor="name">Nombre</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><Label htmlFor="email">Email</Label><Input id="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            <div><Label htmlFor="source">Fuente</Label><Input id="source" value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} /></div>
            <div><Label htmlFor="notes">Notas</Label><Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleSave}>Guardar Lead</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardContent className="p-0">
             {loading ? (
              <div className="text-center py-20"><div className="loader"></div></div>
            ) : leads.length === 0 ? (
              <div className="text-center py-20">
                <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay leads</h3>
                <p className="text-muted-foreground mb-6">Tus nuevos leads aparecerán aquí. Configura la integración en la pestaña de Ajustes.</p>
                <Button onClick={handleAddNew}>Añadir Lead Manualmente</Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.source}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => convertToContact(lead)} title="Convertir a Contacto" className="text-green-600"><UserCheck className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(lead.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Leads;
