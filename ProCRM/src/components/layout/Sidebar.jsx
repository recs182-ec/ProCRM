
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Trello, Users, Building, ShoppingBag, Target, Settings, LogOut, Briefcase, CalendarClock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/proposals', icon: FileText, label: 'Propuestas' },
  { href: '/pipeline', icon: Trello, label: 'Pipeline' },
  { href: '/jobs', icon: Briefcase, label: 'Trabajos' },
  { href: '/annual-services', icon: CalendarClock, label: 'Servicios Anuales' },
  { href: '/leads', icon: Target, label: 'Leads' },
  { href: '/contacts', icon: Users, label: 'Contactos' },
  { href: '/companies', icon: Building, label: 'Compañías' },
  { href: '/services', icon: ShoppingBag, label: 'Servicios' },
];

const Sidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    if (!user) return;
    const fetchLogo = async () => {
        const { data } = await supabase
          .from('settings')
          .select('logo_url')
          .eq('user_id', user.id)
          .single();
        if (data && data.logo_url) {
          setLogoUrl(data.logo_url);
        }
    };
    fetchLogo();

    const settingsListener = supabase.channel('public:settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: `user_id=eq.${user.id}` }, payload => {
        setLogoUrl(payload.new.logo_url);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(settingsListener);
    };

  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <motion.aside
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="w-64 bg-background border-r flex flex-col p-4"
    >
      <div className="flex items-center justify-center gap-2 mb-10 p-4 h-16">
        {logoUrl ? (
          <img src={logoUrl} alt="Company Logo" className="h-full w-auto object-contain" />
        ) : (
          <>
            <Trello className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold">CRM</h1>
          </>
        )}
      </div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-primary transition-colors',
                isActive && 'bg-primary/10 text-primary font-semibold'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto flex flex-col space-y-2">
        <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-primary transition-colors',
                isActive && 'bg-primary/10 text-primary font-semibold'
              )
            }
          >
            <Settings className="h-5 w-5" />
            <span className="font-medium">Configuración</span>
        </NavLink>
        {user && (
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
            <div className="flex flex-col flex-1">
              <p className="font-semibold text-sm text-foreground truncate max-w-[120px]">{user.email}</p>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive p-0 h-auto justify-start">
                <LogOut className="h-4 w-4 mr-1" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
};

export default Sidebar;
