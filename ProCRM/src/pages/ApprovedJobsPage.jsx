
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Briefcase, ChevronDown, ChevronUp, Plus, CheckCircle, Circle, MessageSquare, DollarSign, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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

const ApprovedJobsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState(null);
  const [tasks, setTasks] = useState({});
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [comment, setComment] = useState('');
  const [taskFormData, setTaskFormData] = useState({ service_id: '', service_name: '', due_date: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchApprovedJobsAndTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: jobData, error: jobError } = await supabase
      .from('proposals')
      .select('*, companies(commercial_name)')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .order('approved_at', { ascending: false });

    if (jobError) {
      toast({ title: 'Error', description: 'No se pudieron cargar los trabajos aprobados.', variant: 'destructive' });
      setLoading(false);
      return;
    }
    
    setJobs(jobData);
    
    const jobIds = jobData.map(j => j.id);
    if(jobIds.length > 0) {
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .in('proposal_id', jobIds);
      
      if(taskError) {
        toast({ title: 'Error', description: 'No se pudieron cargar las tareas de los trabajos.', variant: 'destructive' });
      } else {
        const tasksByJob = taskData.reduce((acc, task) => {
          if(!acc[task.proposal_id]) acc[task.proposal_id] = [];
          acc[task.proposal_id].push(task);
          return acc;
        }, {});
        setTasks(tasksByJob);
      }
    }
    
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchApprovedJobsAndTasks();
  }, [fetchApprovedJobsAndTasks]);

  const fetchTasksForJob = async (proposalId) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar las tareas.', variant: 'destructive' });
    } else {
      setTasks(prev => ({ ...prev, [proposalId]: data }));
    }
  };

  const toggleJobExpansion = (jobId) => {
    const newExpandedJob = expandedJob === jobId ? null : jobId;
    setExpandedJob(newExpandedJob);
  };

  const handleOpenTaskDialog = (job) => {
    setCurrentJob(job);
    setTaskFormData({ service_id: '', service_name: '', due_date: '' });
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = async () => {
    if (!taskFormData.service_id || !taskFormData.due_date) {
      toast({ title: 'Error', description: 'Selecciona un servicio y una fecha de vencimiento.', variant: 'destructive' });
      return;
    }
    
    const selectedService = currentJob.services.find(s => s.id === taskFormData.service_id);

    const { error } = await supabase.from('tasks').insert({
      proposal_id: currentJob.id,
      service_id: selectedService.id,
      service_name: selectedService.name,
      due_date: taskFormData.due_date,
      user_id: user.id,
    });

    if (error) {
      toast({ title: 'Error', description: 'No se pudo crear la tarea.', variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: 'Tarea creada exitosamente.' });
      fetchTasksForJob(currentJob.id);
      setIsTaskDialogOpen(false);
    }
  };

  const toggleTaskStatus = async (task) => {
    const newStatus = task.status === 'Pendiente' ? 'Terminada' : 'Pendiente';
    const completed_at = newStatus === 'Terminada' ? new Date().toISOString() : null;
    const { error } = await supabase.from('tasks').update({ status: newStatus, completed_at }).eq('id', task.id);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el estado de la tarea.', variant: 'destructive' });
    } else {
      fetchTasksForJob(task.proposal_id);
    }
  };
  
  const handleOpenCommentDialog = (task) => {
    setCurrentTask(task);
    setComment(task.comments || '');
    setIsCommentDialogOpen(true);
  };

  const handleSaveComment = async () => {
    const { error } = await supabase.from('tasks').update({ comments: comment }).eq('id', currentTask.id);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo guardar el comentario.', variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: 'Comentario guardado.' });
      fetchTasksForJob(currentTask.proposal_id);
      setIsCommentDialogOpen(false);
    }
  };

  const handlePaymentToggle = async (task, isPaid) => {
    const { error } = await supabase.from('tasks').update({ is_paid: isPaid }).eq('id', task.id);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el estado del pago.', variant: 'destructive' });
    } else {
      fetchTasksForJob(task.proposal_id);
    }
  };

  const handleDeleteJob = async (jobId) => {
    const { error } = await supabase.from('proposals').delete().eq('id', jobId);
    if (error) {
        toast({ title: 'Error', description: 'No se pudo eliminar el trabajo. ' + error.message, variant: 'destructive' });
    } else {
        toast({ title: 'Éxito', description: 'El trabajo ha sido eliminado.' });
        fetchApprovedJobsAndTasks();
    }
  };
  
  const countPendingTasksForJob = (jobId) => {
    return tasks[jobId]?.filter(t => t.status === 'Pendiente').length || 0;
  };
  
  const filteredJobs = useMemo(() => {
    if (!searchTerm) return jobs;
    return jobs.filter(job => 
      (job.companies?.commercial_name || job.client_company).toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, jobs]);

  return (
    <div className="w-full">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-4xl font-bold text-gray-800">Trabajos Aprobados</h1>
                <p className="text-muted-foreground text-lg">Gestiona tus proyectos y tareas en curso.</p>
            </div>
            <Input 
                placeholder="Buscar por empresa o cliente..." 
                className="w-1/3" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
            />
        </div>
      </motion.div>

      {loading ? (
        <div className="text-center py-20"><div className="loader"></div></div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-20">
          <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No hay trabajos aprobados</h3>
          <p className="text-muted-foreground">Cuando una propuesta sea aprobada, aparecerá aquí.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map(job => (
            <Card key={job.id}>
              <CardHeader className="cursor-pointer" onClick={() => toggleJobExpansion(job.id)}>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{job.companies?.commercial_name || job.client_company}</CardTitle>
                    <CardDescription>{job.client_name}</CardDescription>
                  </div>
                  <div className="flex items-center gap-6">
                    {countPendingTasksForJob(job.id) > 0 && <Badge variant="destructive">{countPendingTasksForJob(job.id)} pendiente(s)</Badge>}
                    <Badge variant="success" className="bg-green-100 text-green-800">Total: ${job.total.toLocaleString()}</Badge>
                    {expandedJob === job.id ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>
              </CardHeader>
              {expandedJob === job.id && (
                <CardContent>
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold">Tareas del Proyecto</h4>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => handleOpenTaskDialog(job)}><Plus className="h-4 w-4 mr-2" />Crear Tarea</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-2" />Eliminar Trabajo</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro de eliminar este trabajo?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción es irreversible y eliminará la propuesta y todas sus tareas asociadas.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteJob(job.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Servicio</TableHead>
                          <TableHead>Vencimiento</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Terminada el</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasks[job.id]?.map(task => (
                          <TableRow key={task.id} className={task.status === 'Terminada' ? 'bg-green-50' : 'bg-red-50'}>
                            <TableCell>{task.service_name}</TableCell>
                            <TableCell>{new Date(task.due_date).toLocaleDateString()}</TableCell>
                            <TableCell><Badge variant={task.status === 'Terminada' ? 'success' : 'destructive'}>{task.status}</Badge></TableCell>
                            <TableCell>{task.completed_at ? new Date(task.completed_at).toLocaleDateString() : '-'}</TableCell>
                            <TableCell className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => toggleTaskStatus(task)}>
                                {task.status === 'Pendiente' ? <CheckCircle className="h-4 w-4 mr-2" /> : <Circle className="h-4 w-4 mr-2" />}
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleOpenCommentDialog(task)} className="h-8 w-8">
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                              <div className="flex items-center" title="Marcar como pagado">
                               <Checkbox id={`paid-${task.id}`} checked={task.is_paid} onCheckedChange={(checked) => handlePaymentToggle(task, checked)} />
                               <DollarSign className="h-4 w-4 ml-2 text-green-600"/>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!tasks[job.id] || tasks[job.id].length === 0) && (
                          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No hay tareas para este proyecto.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Tarea</DialogTitle>
            <DialogDescription>Para el proyecto de {currentJob?.client_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Servicio</Label>
              <Select onValueChange={(value) => setTaskFormData({...taskFormData, service_id: value})}>
                <SelectTrigger><SelectValue placeholder="Seleccionar servicio" /></SelectTrigger>
                <SelectContent>
                  {currentJob?.services.filter(s => currentJob.approved_services.includes(s.id)).map(service => (
                    <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label htmlFor="due_date">Fecha de Vencimiento</Label><Input id="due_date" type="date" value={taskFormData.due_date} onChange={(e) => setTaskFormData({...taskFormData, due_date: e.target.value})} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveTask}>Guardar Tarea</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comentarios para Tarea</DialogTitle>
            <DialogDescription>{currentTask?.service_name}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={5} placeholder="Añade tus comentarios aquí..." />
          </div>
          <DialogFooter><Button onClick={handleSaveComment}>Guardar Comentario</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovedJobsPage;
