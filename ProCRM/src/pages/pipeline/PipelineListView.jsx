import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const stageColors = {
    'Leads o Prospectos': 'bg-blue-100 text-blue-800',
    'Calificación': 'bg-yellow-100 text-yellow-800',
    'Propuesta Enviada': 'bg-purple-100 text-purple-800',
    'Negociación': 'bg-orange-100 text-orange-800',
    'Aprobado': 'bg-green-100 text-green-800',
    'Rechazado': 'bg-red-100 text-red-800',
  };

const PipelineListView = ({ tasks }) => {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });
  const [copiedId, setCopiedId] = useState(null);
  const { toast } = useToast();

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const copyToClipboard = (id) => {
    const proposalLink = `${window.location.origin}/proposal/${id}`;
    navigator.clipboard.writeText(proposalLink);
    setCopiedId(id);
    toast({ title: 'Copiado', description: 'Enlace de la propuesta copiado.' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTasks = useMemo(() => {
    let sortableItems = [...tasks];

    if (filter) {
        sortableItems = sortableItems.filter(task => {
            const name = task.type === 'proposal' ? task.client_name : task.name;
            const companyName = task.type === 'proposal' ? (task.companies?.commercial_name || task.client_company) : '';
            return name.toLowerCase().includes(filter.toLowerCase()) || (companyName && companyName.toLowerCase().includes(filter.toLowerCase()));
        });
    }

    if (statusFilter !== 'all') {
        sortableItems = sortableItems.filter(task => (task.pipeline_stage || (task.type === 'proposal' ? 'Calificación' : 'Leads o Prospectos')) === statusFilter);
    }
    
    sortableItems.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'total') {
        aValue = a.total || 0;
        bValue = b.total || 0;
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    return sortableItems;
  }, [tasks, filter, statusFilter, sortConfig]);

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
            <Input 
                placeholder="Filtrar por nombre o empresa..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="max-w-sm"
            />
             <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {Object.keys(stageColors).map(stage => (
                        <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
                <Button variant="ghost" onClick={() => handleSort('client_name')}>
                    Nombre {getSortIndicator('client_name')}
                </Button>
            </TableHead>
            <TableHead>
                <Button variant="ghost" onClick={() => handleSort('pipeline_stage')}>
                    Estado {getSortIndicator('pipeline_stage')}
                </Button>
            </TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>
                <Button variant="ghost" onClick={() => handleSort('total')}>
                    Valor {getSortIndicator('total')}
                </Button>
            </TableHead>
            <TableHead>
                <Button variant="ghost" onClick={() => handleSort('created_at')}>
                    Fecha Creación {getSortIndicator('created_at')}
                </Button>
            </TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTasks.map((task) => {
            const name = task.type === 'proposal' ? task.client_name : task.name;
            const stage = task.pipeline_stage || (task.type === 'proposal' ? 'Calificación' : 'Leads o Prospectos');

            return (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{name}</TableCell>
                <TableCell>
                  <Badge className={`${stageColors[stage]} hover:${stageColors[stage]}`}>
                    {stage}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{task.type === 'proposal' ? 'Propuesta' : 'Lead'}</Badge>
                </TableCell>
                <TableCell>
                  {task.type === 'proposal' ? `$${(task.total || 0).toLocaleString()}` : 'N/A'}
                </TableCell>
                <TableCell>{new Date(task.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="flex items-center gap-2">
                  {task.type === 'proposal' && (
                    <>
                      <Button asChild variant="link" size="sm">
                        <Link to={`/create?edit=${task.id}`}>Ver</Link>
                      </Button>
                      {task.status === 'sent' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(task.id)}>
                          {copiedId === task.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default PipelineListView;