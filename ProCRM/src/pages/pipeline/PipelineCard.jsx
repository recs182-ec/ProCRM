import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

const PipelineCard = ({ task, stage }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: task.id,
        data: {
            stage,
            type: task.type
        }
    });
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const copyToClipboard = (e) => {
        e.stopPropagation();
        const proposalLink = `${window.location.origin}/proposal/${task.id}`;
        navigator.clipboard.writeText(proposalLink);
        setIsCopied(true);
        toast({ title: 'Copiado', description: 'Enlace de la propuesta copiado.' });
        setTimeout(() => setIsCopied(false), 2000);
    };

    const renderCardContent = () => {
        if (task.type === 'proposal') {
            return (
                <>
                    <div className="flex justify-between items-start">
                        <Link to={`/create?edit=${task.id}`} onClick={e => e.stopPropagation()} className="font-semibold text-base hover:underline">{task.client_name}</Link>
                        {task.status === 'sent' && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyToClipboard}>
                                {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Briefcase className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{task.companies?.commercial_name || task.client_company || 'N/A'}</span>
                    </div>
                    <div className="text-lg font-bold text-primary mt-2">${(task.total || 0).toLocaleString()}</div>
                </>
            );
        }
        return (
            <>
                <p className="font-semibold text-base">{task.name}</p>
                <p className="text-sm text-muted-foreground mt-1 truncate">{task.email}</p>
                {task.source && <Badge variant="outline" className="mt-2">{task.source}</Badge>}
            </>
        );
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            layoutId={task.id}
            className="cursor-grab active:cursor-grabbing"
            whileHover={{ scale: 1.03 }}
        >
            <Card className="bg-card hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                    {renderCardContent()}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default PipelineCard;