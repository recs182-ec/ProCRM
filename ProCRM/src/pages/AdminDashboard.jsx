
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle, Edit, Eye, Trash2, DollarSign, Target, Calendar as CalendarIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays } from "date-fns";
import { es } from 'date-fns/locale';

const AdminDashboard = () => {
  const [proposals, setProposals] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    draft: 0,
    approvedValue: 0,
    leadsCount: 0,
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const fetchDashboardData = useCallback(async () => {
    if (!user || !date.from || !date.to) return;
    setLoading(true);

    const fromDate = date.from.toISOString();
    const toDate = date.to.toISOString();

    const { data: proposalsData, error: proposalsError } = await supabase
      .from('proposals')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', fromDate)
      .lte('created_at', toDate)
      .order('created_at', { ascending: false });

    const { count: leadsCount, error: leadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', fromDate)
      .lte('created_at', toDate);

    if (proposalsError || leadsError) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard."
      });
    } else {
      const approvedProposals = proposalsData.filter(p => p.status === 'approved');
      const approvedValue = approvedProposals.reduce((sum, p) => sum + (p.total || 0), 0);

      setStats({
        total: proposalsData.length,
        pending: proposalsData.filter(p => p.status === 'sent').length,
        approved: approvedProposals.length,
        draft: proposalsData.filter(p => p.status === 'draft').length,
        approvedValue: approvedValue,
        leadsCount: leadsCount || 0,
      });
      setProposals(proposalsData.slice(0, 3));
    }
    setLoading(false);
  }, [user, toast, date]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusBadge = status => {
    const statusConfig = {
      draft: { label: 'Borrador', variant: 'secondary' },
      sent: { label: 'Enviada', variant: 'default' },
      approved: { label: 'Aprobada', variant: 'default' },
      rejected: { label: 'Rechazada', variant: 'destructive' }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant} className={status === 'approved' ? 'bg-green-600' : ''}>{config.label}</Badge>;
  };

  const deleteProposal = async id => {
    const { error } = await supabase.from('proposals').delete().eq('id', id);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar la propuesta." });
    } else {
      toast({ title: "Propuesta eliminada", description: "La propuesta ha sido eliminada exitosamente." });
      fetchDashboardData();
    }
  };

  return (
    <div className="w-full">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Dashboard</h1>
          <p className="text-muted-foreground text-lg">Un resumen de tu actividad.</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className="w-[300px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                    {format(date.to, "LLL dd, y", { locale: es })}
                  </>
                ) : (
                  format(date.from, "LLL dd, y", { locale: es })
                )
              ) : (
                <span>Elige una fecha</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
              locale={es}
            />
          </PopoverContent>
        </Popover>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <Card className="glass-effect border-0"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Propuestas</p><p className="text-3xl font-bold text-blue-400">{loading ? '...' : stats.total}</p></div><FileText className="h-8 w-8 text-blue-400" /></div></CardContent></Card>
        <Card className="glass-effect border-0"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Pendientes</p><p className="text-3xl font-bold text-yellow-400">{loading ? '...' : stats.pending}</p></div><Clock className="h-8 w-8 text-yellow-400" /></div></CardContent></Card>
        <Card className="glass-effect border-0"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Aprobadas</p><p className="text-3xl font-bold text-green-400">{loading ? '...' : stats.approved}</p></div><CheckCircle className="h-8 w-8 text-green-400" /></div></CardContent></Card>
        <Card className="glass-effect border-0"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Borradores</p><p className="text-3xl font-bold text-gray-400">{loading ? '...' : stats.draft}</p></div><Edit className="h-8 w-8 text-gray-400" /></div></CardContent></Card>
        <Card className="glass-effect border-0"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Valor Aprobado</p><p className="text-3xl font-bold text-teal-400">{loading ? '...' : `$${stats.approvedValue.toLocaleString()}`}</p></div><DollarSign className="h-8 w-8 text-teal-400" /></div></CardContent></Card>
        <Card className="glass-effect border-0"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Nuevos Leads</p><p className="text-3xl font-bold text-purple-400">{loading ? '...' : stats.leadsCount}</p></div><Target className="h-8 w-8 text-purple-400" /></div></CardContent></Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="glass-effect border-0">
          <CardHeader><CardTitle className="text-2xl">Propuestas Recientes</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="text-center py-20"><div className="loader"></div></div> : proposals.length === 0 ? <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay propuestas en este rango</h3>
                <p className="text-muted-foreground mb-6">Crea una nueva propuesta o ajusta el rango de fechas.</p>
                <Link to="/proposals"><Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">Ir a Propuestas</Button></Link>
              </div> : <div className="space-y-4">
                {proposals.map((proposal, index) => <motion.div key={proposal.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="proposal-card rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-xl font-semibold">{proposal.client_name}</h3>
                          {getStatusBadge(proposal.status)}
                        </div>
                        <p className="text-muted-foreground mb-2">{proposal.client_email}</p>
                        <p className="text-2xl font-bold text-green-400">${parseFloat(proposal.total).toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Creada: {new Date(proposal.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={`/proposal/${proposal.id}`}><Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-2" />Ver</Button></Link>
                        <Link to={`/create?edit=${proposal.id}`}><Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-2" />Editar</Button></Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente la propuesta.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteProposal(proposal.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </motion.div>)}
              </div>}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
export default AdminDashboard;
