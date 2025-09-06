
import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import PipelineColumn from '@/pages/pipeline/PipelineColumn';
import PipelineListView from '@/pages/pipeline/PipelineListView';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';

const pipelineStages = ['Leads o Prospectos', 'Calificación', 'Propuesta Enviada', 'Negociación', 'Aprobado', 'Rechazado'];

const PipelinePage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [tasks, setTasks] = useState({});
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 8,
        },
      })
    );

    const fetchTasks = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        const { data: proposals, error: pError } = await supabase.from('proposals').select('*, contacts(name), companies(commercial_name)').eq('user_id', user.id);
        const { data: leads, error: lError } = await supabase.from('leads').select('*').eq('user_id', user.id);

        if (pError || lError) {
            toast({ title: "Error", description: "No se pudieron cargar los datos del pipeline.", variant: 'destructive'});
            setTasks({});
        } else {
            const allTasks = {};
            pipelineStages.forEach(stage => allTasks[stage] = []);

            leads.forEach(lead => {
                const stage = lead.pipeline_stage || 'Leads o Prospectos';
                if (allTasks[stage]) {
                    allTasks[stage].push({ ...lead, type: 'lead' });
                }
            });

            proposals.forEach(proposal => {
                const stage = proposal.pipeline_stage || 'Calificación';
                if (allTasks[stage]) {
                    allTasks[stage].push({ ...proposal, type: 'proposal' });
                }
            });
            setTasks(allTasks);
        }
        setLoading(false);
    }, [user, toast]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over || !active) return;
        
        const taskId = active.id;
        const newStage = over.id;
        const oldStage = active.data.current.stage;

        if (newStage === oldStage) return;
        
        const taskType = active.data.current.type;
        const tableName = taskType === 'lead' ? 'leads' : 'proposals';

        setTasks(prev => {
            const newTasks = { ...prev };
            const taskIndex = newTasks[oldStage].findIndex(t => t.id === taskId);
            if (taskIndex === -1) return prev;
            const [movedTask] = newTasks[oldStage].splice(taskIndex, 1);
            movedTask.pipeline_stage = newStage;
            newTasks[newStage].push(movedTask);
            return newTasks;
        });

        const { error } = await supabase
            .from(tableName)
            .update({ pipeline_stage: newStage })
            .eq('id', taskId);

        if (error) {
            toast({ title: "Error", description: `No se pudo mover la tarjeta. ${error.message}`, variant: "destructive" });
            fetchTasks(); 
        } else {
            toast({ title: "Movimiento exitoso", description: `La tarjeta se movió a ${newStage}.` });
        }
    };
    
    const allTasksForList = Object.values(tasks).flat();

    return (
        <div className="w-full">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex justify-between items-center">
                <div>
                  <h1 className="text-4xl font-bold text-gray-800">Pipeline de Ventas</h1>
                  <p className="text-muted-foreground text-lg">Visualiza y gestiona tu proceso de ventas.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant={viewMode === 'kanban' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('kanban')}>
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}>
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </motion.div>
            
            {loading ? (
                <div className="flex justify-center items-center h-96"><div className="loader"></div></div>
            ) : viewMode === 'kanban' ? (
                <div className="overflow-x-auto pb-4">
                    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                        <div className="flex gap-5 min-w-max">
                            {pipelineStages.map(stage => (
                                <PipelineColumn key={stage} stage={stage} tasks={tasks[stage] || []} />
                            ))}
                        </div>
                    </DndContext>
                </div>
            ) : (
                <PipelineListView tasks={allTasksForList} />
            )}
        </div>
    );
};

export default PipelinePage;
