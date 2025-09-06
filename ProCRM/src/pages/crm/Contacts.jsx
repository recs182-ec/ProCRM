
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Combobox } from '@/components/ui/combobox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Contacts = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company_id: null, position: '' });
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from('contacts').select('*, companies(commercial_name)').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los contactos.', variant: 'destructive' });
    } else {
      setContacts(data);
    }
    setLoading(false);
  }, [user, toast]);

  const fetchCompanies = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('companies').select('id, commercial_name').eq('user_id', user.id);
    if (!error) setCompanies(data);
  }, [user]);

  useEffect(() => {
    fetchContacts();
    fetchCompanies();
  }, [fetchContacts, fetchCompanies]);

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast({ title: 'Error', description: 'Nombre y email son obligatorios.', variant: 'destructive' });
      return;
    }

    const payload = { ...formData, company_id: formData.company_id || null };

    if (currentContact) {
      const { error } = await supabase.from('contacts').update(payload).eq('id', currentContact.id);
      if (error) {
        toast({ title: 'Error', description: 'No se pudo actualizar el contacto.', variant: 'destructive' });
      } else {
        toast({ title: 'Éxito', description: 'Contacto actualizado.' });
      }
    } else {
      const { error } = await supabase.from('contacts').insert({ ...payload, user_id: user.id });
      if (error) {
        toast({ title: 'Error', description: 'No se pudo crear el contacto.', variant: 'destructive' });
      } else {
        toast({ title: 'Éxito', description: 'Contacto creado.' });
      }
    }
    fetchContacts();
    setIsDialogOpen(false);
    setCurrentContact(null);
  };

  const handleOpenDialog = (contact = null) => {
    setCurrentContact(contact);
    if (contact) {
      setFormData({ name: contact.name, email: contact.email, phone: contact.phone || '', company_id: contact.company_id, position: contact.position || '' });
    } else {
      setFormData({ name: '', email: '', phone: '', company_id: null, position: '' });
    }
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (id) => {
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el contacto.', variant: 'destructive' });
    } else {
      toast({ title: 'Contacto eliminado', description: 'El contacto ha sido eliminado.' });
      fetchContacts();
    }
  };
  
  const companyOptions = companies.map(c => ({ value: c.id, label: c.commercial_name }));

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.companies && contact.companies.commercial_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [contacts, searchTerm]);


  return (
    <div className="w-full">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Contactos</h1>
          <p className="text-muted-foreground text-lg">Administra tus contactos y clientes.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Añadir Contacto
          </Button>
        </div>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>{currentContact ? 'Editar Contacto' : 'Añadir Nuevo Contacto'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label htmlFor="name">Nombre</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><Label htmlFor="email">Email</Label><Input id="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            <div><Label htmlFor="phone">Teléfono</Label><Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
            <div><Label htmlFor="position">Cargo</Label><Input id="position" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} /></div>
            <div>
              <Label htmlFor="company_id">Compañía</Label>
               <Combobox
                options={companyOptions}
                value={formData.company_id}
                onChange={(value) => setFormData({ ...formData, company_id: value })}
                placeholder="Seleccionar compañía"
                searchPlaceholder="Buscar compañía..."
              />
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-20"><div className="loader"></div></div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-20">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay contactos</h3>
                <p className="text-muted-foreground mb-6">{searchTerm ? 'No se encontraron contactos.' : 'Añade tu primer contacto para empezar.'}</p>
                <Button onClick={() => handleOpenDialog()}>Añadir Contacto</Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Compañía</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>{contact.email}</TableCell>
                      <TableCell>{contact.position}</TableCell>
                      <TableCell>{contact.companies?.commercial_name}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(contact)}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente el contacto y todas sus propuestas y trabajos asociados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(contact.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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

export default Contacts;