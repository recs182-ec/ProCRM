
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import PipelineCard from '@/pages/pipeline/PipelineCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PipelineColumn = ({ stage, tasks }) => {
    const { setNodeRef, isOver } = useDroppable({ id: stage });

    return (
        <Card ref={setNodeRef} className={`w-[300px] flex flex-col flex-shrink-0 ${isOver ? 'bg-primary/10' : 'bg-secondary'}`}>
            <CardHeader className="p-4 border-b">
                <CardTitle className="text-base font-semibold flex justify-between items-center">
                    {stage}
                    <Badge variant="secondary">{tasks.length}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-2 h-full overflow-y-auto space-y-2">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <PipelineCard key={task.id} task={task} stage={stage} />
                    ))}
                </SortableContext>
            </CardContent>
        </Card>
    );
};

export default PipelineColumn;
