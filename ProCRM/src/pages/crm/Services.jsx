import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, ShoppingBag, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Services = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: 0, frequency: 'Una vez' });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchServices = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from('services').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los servicios.', variant: 'destructive' });
    } else {
      setServices(data);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleSave = async () => {
    if (!formData.name || formData.price < 0) {
      toast({ title: 'Error', description: 'Nombre y precio válido son obligatorios.', variant: 'destructive' });
      return;
    }

    if (currentService) {
      const { error } = await supabase.from('services').update(formData).eq('id', currentService.id);
      if (error) {
        toast({ title: 'Error', description: 'No se pudo actualizar el servicio.', variant: 'destructive' });
      } else {
        toast({ title: 'Éxito', description: 'Servicio actualizado.' });
      }
    } else {
      const { error } = await supabase.from('services').insert({ ...formData, user_id: user.id });
      if (error) {
        toast({ title: 'Error', description: 'No se pudo crear el servicio.', variant: 'destructive' });
      } else {
        toast({ title: 'Éxito', description: 'Servicio creado.' });
      }
    }
    fetchServices();
    setIsDialogOpen(false);
    setCurrentService(null);
  };

  const handleOpenDialog = (service = null) => {
    setCurrentService(service);
    if (service) {
      setFormData({ name: service.name, description: service.description, price: service.price, frequency: service.frequency });
    } else {
      setFormData({ name: '', description: '', price: 0, frequency: 'Una vez' });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el servicio.', variant: 'destructive' });
    } else {
      toast({ title: 'Servicio eliminado', description: 'El servicio ha sido eliminado.' });
      fetchServices();
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter(service =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [services, searchTerm]);

  return (
    <div className="w-full">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Servicios</h1>
          <p className="text-muted-foreground text-lg">Define y gestiona los servicios que ofreces.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Añadir Servicio
          </Button>
        </div>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>{currentService ? 'Editar Servicio' : 'Añadir Nuevo Servicio'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label htmlFor="name">Nombre</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><Label htmlFor="description">Descripción</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <div><Label htmlFor="price">Precio ($)</Label><Input id="price" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} /></div>
            <div>
              <Label htmlFor="frequency">Frecuencia</Label>
              <Select onValueChange={(value) => setFormData({...formData, frequency: value})} value={formData.frequency}>
                <SelectTrigger><SelectValue placeholder="Seleccionar frecuencia" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Una vez">Una vez</SelectItem>
                  <SelectItem value="Mensual">Mensual</SelectItem>
                  <SelectItem value="Anual">Anual</SelectItem>
                </SelectContent>
              </Select>
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
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay servicios</h3>
                <p className="text-muted-foreground mb-6">{searchTerm ? 'No se encontraron servicios.' : 'Añade tu primer servicio para usarlo en las propuestas.'}</p>
                <Button onClick={() => handleOpenDialog()}>Añadir Servicio</Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Frecuencia</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>{service.frequency}</TableCell>
                      <TableCell className="font-semibold text-primary">${parseFloat(service.price).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(service)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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

export default Services;