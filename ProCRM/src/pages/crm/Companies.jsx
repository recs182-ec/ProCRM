
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Building, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
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

const Companies = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [formData, setFormData] = useState({
    commercial_name: '',
    razon_social: '',
    ruc: '',
    website: '',
    phone: '',
    address: '',
    industry: '',
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCompanies = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from('companies').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar las compañías.', variant: 'destructive' });
    } else {
      setCompanies(data);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleSave = async () => {
    if (!formData.commercial_name) {
      toast({ title: 'Error', description: 'El nombre comercial es obligatorio.', variant: 'destructive' });
      return;
    }

    if (currentCompany) {
      const { error } = await supabase.from('companies').update(formData).eq('id', currentCompany.id);
      if (error) {
        toast({ title: 'Error', description: 'No se pudo actualizar la compañía.', variant: 'destructive' });
      } else {
        toast({ title: 'Éxito', description: 'Compañía actualizada exitosamente.' });
      }
    } else {
      const { error } = await supabase.from('companies').insert({ ...formData, user_id: user.id });
      if (error) {
        toast({ title: 'Error', description: 'No se pudo crear la compañía.', variant: 'destructive' });
      } else {
        toast({ title: 'Éxito', description: 'Compañía creada exitosamente.' });
      }
    }
    fetchCompanies();
    setIsDialogOpen(false);
    setCurrentCompany(null);
  };

  const handleOpenDialog = (company = null) => {
    setCurrentCompany(company);
    if (company) {
      setFormData({
        commercial_name: company.commercial_name || '',
        razon_social: company.razon_social || '',
        ruc: company.ruc || '',
        website: company.website || '',
        phone: company.phone || '',
        address: company.address || '',
        industry: company.industry || '',
        notes: company.notes || ''
      });
    } else {
      setFormData({ commercial_name: '', razon_social: '', ruc: '', website: '', phone: '', address: '', industry: '', notes: '' });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar la compañía.', variant: 'destructive' });
    } else {
      toast({ title: 'Compañía eliminada', description: 'La compañía ha sido eliminada.' });
      fetchCompanies();
    }
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter(company =>
      company.commercial_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.ruc && company.ruc.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [companies, searchTerm]);

  return (
    <div className="w-full">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Compañías</h1>
          <p className="text-muted-foreground text-lg">Gestiona las empresas de tus clientes.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar compañía..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Añadir Compañía
          </Button>
        </div>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{currentCompany ? 'Editar Compañía' : 'Añadir Nueva Compañía'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div><Label htmlFor="commercial_name">Nombre Comercial</Label><Input id="commercial_name" value={formData.commercial_name} onChange={(e) => setFormData({ ...formData, commercial_name: e.target.value })} /></div>
            <div><Label htmlFor="razon_social">Razón Social</Label><Input id="razon_social" value={formData.razon_social} onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })} /></div>
            <div><Label htmlFor="ruc">RUC</Label><Input id="ruc" value={formData.ruc} onChange={(e) => setFormData({ ...formData, ruc: e.target.value })} /></div>
            <div><Label htmlFor="website">Sitio Web</Label><Input id="website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} /></div>
            <div><Label htmlFor="phone">Teléfono</Label><Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
            <div><Label htmlFor="address">Dirección / País</Label><Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
            <div className="col-span-2"><Label htmlFor="industry">Industria</Label><Input id="industry" value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} /></div>
            <div className="col-span-2"><Label htmlFor="notes">Notas</Label><Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-20"><div className="loader"></div></div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-20">
                <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay compañías</h3>
                <p className="text-muted-foreground mb-6">{searchTerm ? 'No se encontraron compañías con ese criterio.' : 'Añade tu primera compañía para empezar.'}</p>
                <Button onClick={() => handleOpenDialog()}>Añadir Compañía</Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Comercial</TableHead>
                    <TableHead>RUC</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Sitio Web</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.commercial_name}</TableCell>
                      <TableCell>{company.ruc}</TableCell>
                      <TableCell>{company.phone}</TableCell>
                      <TableCell><a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{company.website}</a></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(company)}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente la compañía y todos sus contactos, propuestas y trabajos asociados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(company.id)}>Eliminar</AlertDialogAction>
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

export default Companies;
