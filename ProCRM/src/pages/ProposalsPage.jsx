
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Copy, Check, Eye, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProposalsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const fetchProposals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('proposals')
      .select('*, companies(commercial_name), contacts(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar las propuestas.', variant: 'destructive' });
    } else {
      setProposals(data);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const copyToClipboard = (id) => {
    const proposalLink = `${window.location.origin}/proposal/${id}`;
    navigator.clipboard.writeText(proposalLink);
    setCopiedId(id);
    toast({ title: 'Copiado', description: 'Enlace de la propuesta copiado.' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: 'Borrador', variant: 'secondary' },
      sent: { label: 'Enviada', variant: 'default' },
      approved: { label: 'Aprobada', variant: 'default', className: 'bg-green-600 hover:bg-green-700' },
      rejected: { label: 'Rechazada', variant: 'destructive' }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const filteredProposals = useMemo(() => {
    return proposals.filter(p =>
      p.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.companies?.commercial_name && p.companies.commercial_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [proposals, searchTerm]);

  return (
    <div className="w-full">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Propuestas</h1>
          <p className="text-muted-foreground text-lg">Lista de todas las propuestas enviadas.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por empresa o contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-72"
            />
          </div>
          <Link to="/create">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white pulse-glow">
              <Plus className="mr-2 h-5 w-5" />
              Nueva Propuesta
            </Button>
          </Link>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-20"><div className="loader"></div></div>
            ) : filteredProposals.length === 0 ? (
              <div className="text-center py-20">
                <h3 className="text-xl font-semibold mb-2">No hay propuestas</h3>
                <p className="text-muted-foreground">Las propuestas que crees aparecerán aquí.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Compañía</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProposals.map((proposal) => (
                    <TableRow key={proposal.id}>
                      <TableCell className="font-medium">{proposal.client_name}</TableCell>
                      <TableCell>{proposal.companies?.commercial_name || proposal.client_company}</TableCell>
                      <TableCell>${(proposal.total || 0).toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                      <TableCell>{new Date(proposal.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right flex items-center justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/proposal/${proposal.id}`}><Eye className="h-4 w-4 mr-2" />Ver</Link>
                        </Button>
                        {proposal.status === 'sent' && (
                          <Button variant="ghost" size="icon" onClick={() => copyToClipboard(proposal.id)}>
                            {copiedId === proposal.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        )}
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

export default ProposalsPage;
