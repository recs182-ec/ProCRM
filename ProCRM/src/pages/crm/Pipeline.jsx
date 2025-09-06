
import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const pipelineStages = ["Leads o Prospectos", "Calificación", "Propuesta Enviada", "Negociación", "Aprobado", "Rechazado"];

const SortableProposal = ({ proposal }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: proposal.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 100 : "auto" };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-2 bg-white shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <p className="font-semibold text-gray-800">{proposal.client_name || proposal.name}</p>
          <p className="text-sm text-gray-500">{proposal.client_company || proposal.email}</p>
          {proposal.total && <p className="text-sm font-bold text-primary mt-1">${parseFloat(proposal.total || 0).toLocaleString()}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

const PipelineColumn = ({ id, title, proposals }) => {
    const { setNodeRef } = useSortable({ id });

    return (
        <div ref={setNodeRef} className="w-72 flex-shrink-0 bg-gray-100 rounded-lg">
            <div className="p-4 border-b">
                <h3 className="text-base font-semibold text-gray-700 flex justify-between items-center">
                    {title}
                    <Badge variant="secondary">{proposals.length}</Badge>
                </h3>
            </div>
            <div className="p-2 h-full min-h-[200px]">
                <SortableContext items={proposals.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    {proposals.map(proposal => <SortableProposal key={proposal.id} proposal={proposal} />)}
                </SortableContext>
            </div>
        </div>
    );
};


const Pipeline = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: proposals, error: pError } = await supabase.from('proposals').select('*').eq('user_id', user.id);
    const { data: leads, error: lError } = await supabase.from('leads').select('*').eq('user_id', user.id);

    if (pError || lError) {
      toast({ title: 'Error', description: 'No se pudieron cargar las tareas del pipeline.', variant: 'destructive' });
      setTasks({});
    } else {
        const initialTasks = pipelineStages.reduce((acc, stage) => ({ ...acc, [stage]: [] }), {});
        
        leads.forEach(lead => {
            const stage = lead.pipeline_stage || 'Leads o Prospectos';
            if(initialTasks[stage]) initialTasks[stage].push({ ...lead, type: 'lead' });
        });

        proposals.forEach(proposal => {
            const stage = proposal.pipeline_stage || 'Propuesta Enviada';
            if(initialTasks[stage]) initialTasks[stage].push({ ...proposal, type: 'proposal' });
        });

        setTasks(initialTasks);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;

    // Find which column the active item and over item belong to
    const activeContainer = Object.keys(tasks).find(key => tasks[key].some(item => item.id === activeId));
    let overContainer = Object.keys(tasks).find(key => tasks[key].some(item => item.id === overId));
    if (!overContainer) {
        overContainer = pipelineStages.includes(overId) ? overId : null;
    }

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }
    
    const activeItem = tasks[activeContainer].find(item => item.id === activeId);

    setTasks(prev => {
        const newTasks = { ...prev };
        const activeItems = newTasks[activeContainer];
        const overItems = newTasks[overContainer];
        const activeIndex = activeItems.findIndex(item => item.id === activeId);
        
        // Remove from old container
        activeItems.splice(activeIndex, 1);
        // Add to new container
        overItems.push(activeItem);

        return newTasks;
    });

    const tableName = activeItem.type === 'lead' ? 'leads' : 'proposals';
    const { error } = await supabase.from(tableName).update({ pipeline_stage: overContainer }).eq('id', activeId);
    
    if (error) {
      toast({ title: 'Error', description: 'No se pudo mover la tarjeta.', variant: 'destructive' });
      fetchTasks(); // Revert to DB state on failure
    } else {
      toast({ title: 'Tarjeta movida', description: `Movida a ${overContainer}.` });
    }
  };
  
  return (
    <div className="w-full">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Pipeline de Ventas</h1>
          <p className="text-muted-foreground text-lg">Visualiza y gestiona el flujo de tus propuestas.</p>
        </div>
      </motion.div>
      
      {loading ? (
        <div className="flex justify-center items-center h-96"><div className="loader"></div></div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {pipelineStages.map(stage => (
              <PipelineColumn key={stage} id={stage} title={stage} proposals={tasks[stage] || []} />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
};

export default Pipeline;
