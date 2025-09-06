import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Briefcase, Users, Cog, Target, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const CrmDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ companies: 0, contacts: 0, services: 0, leads: 0 });
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        const tableCounts = ['companies', 'contacts', 'services', 'leads'];
        const promises = tableCounts.map(table =>
            supabase.from(table).select('id', { count: 'exact', head: true }).eq('user_id', user.id)
        );
        const results = await Promise.all(promises);
        
        const newStats = {
            companies: results[0].count || 0,
            contacts: results[1].count || 0,
            services: results[2].count || 0,
            leads: results[3].count || 0,
        };

        setStats(newStats);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const statCards = [
        { title: 'Leads', value: stats.leads, icon: Target, color: 'text-yellow-400', link: '/crm/leads' },
        { title: 'Contactos', value: stats.contacts, icon: Users, color: 'text-green-400', link: '/crm/contacts' },
        { title: 'Compañías', value: stats.companies, icon: Briefcase, color: 'text-blue-400', link: '/crm/companies' },
        { title: 'Servicios', value: stats.services, icon: Cog, color: 'text-purple-400', link: '/crm/services' },
    ];

    return (
        <div className="w-full">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="text-4xl font-bold gradient-text mb-2">CRM Dashboard</h1>
                <p className="text-muted-foreground text-lg">Una vista general de tu actividad de ventas.</p>
            </motion.div>

            <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                initial="hidden"
                animate="visible"
                variants={{
                    visible: { transition: { staggerChildren: 0.1 } }
                }}
            >
                {statCards.map((card, index) => (
                    <motion.div key={index} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                        <Card className="glass-effect border-0 hover:border-blue-500/50 transition-all duration-300">
                          <Link to={card.link}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{card.title}</p>
                                        <p className={`text-3xl font-bold ${card.color}`}>{loading ? '...' : card.value}</p>
                                    </div>
                                    <card.icon className={`h-8 w-8 ${card.color}`} />
                                </div>
                            </CardContent>
                          </Link>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <Card className="glass-effect border-0">
                <CardHeader>
                  <CardTitle>Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">La actividad reciente aparecerá aquí.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-effect border-0">
                <CardHeader>
                  <CardTitle>Accesos Rápidos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link to="/crm/leads" className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <span>Ver Leads</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link to="/crm/contacts" className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <span>Ver Contactos</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                   <Link to="/crm/companies" className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <span>Ver Compañías</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
        </div>
    );
};

export default CrmDashboard;