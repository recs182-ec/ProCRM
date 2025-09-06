import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Save, Bell, Users, User } from 'lucide-react';

const defaultSettings = {
  client_notifications: {
    new_proposal: true,
    proposal_accepted: true,
  },
  internal_notifications: {
    new_proposal: true,
    proposal_accepted: true,
    new_job: true,
    new_task: true,
    new_lead: true,
  },
};

const NotificationSettings = () => {
    const { user, fetchProfile } = useAuth();
    const { toast } = useToast();
    const [settings, setSettings] = useState(defaultSettings);
    const [loading, setLoading] = useState(true);

    const loadSettings = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const profile = await fetchProfile(user.id);
        if (profile?.notification_settings) {
            setSettings(prevState => ({
                ...defaultSettings,
                ...profile.notification_settings,
                client_notifications: {
                    ...defaultSettings.client_notifications,
                    ...profile.notification_settings.client_notifications,
                },
                internal_notifications: {
                    ...defaultSettings.internal_notifications,
                    ...profile.notification_settings.internal_notifications,
                },
            }));
        }
        setLoading(false);
    }, [user, fetchProfile]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);
    
    const handleCheckboxChange = (category, key) => {
        setSettings(prevSettings => ({
            ...prevSettings,
            [category]: {
                ...prevSettings[category],
                [key]: !prevSettings[category][key],
            },
        }));
    };

    const handleSave = async () => {
        if (!user) return;
        
        const { error } = await supabase
            .from('profiles')
            .update({ notification_settings: settings })
            .eq('id', user.id);

        if (error) {
            toast({ title: 'Error', description: 'No se pudo guardar la configuración de notificaciones.', variant: 'destructive' });
        } else {
            toast({ title: 'Éxito', description: 'Configuración de notificaciones guardada.' });
            await loadSettings();
        }
    };

    if (loading) {
        return <Card><CardContent className="pt-6"><p>Cargando configuración...</p></CardContent></Card>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" />Configuración de Notificaciones</CardTitle>
                <CardDescription>Elige qué notificaciones por correo electrónico se deben enviar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><User className="h-5 w-5" />Notificaciones al Cliente</h3>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="client_new_proposal" checked={settings.client_notifications.new_proposal} onCheckedChange={() => handleCheckboxChange('client_notifications', 'new_proposal')} />
                            <Label htmlFor="client_new_proposal">Crear una propuesta nueva.</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="client_proposal_accepted" checked={settings.client_notifications.proposal_accepted} onCheckedChange={() => handleCheckboxChange('client_notifications', 'proposal_accepted')} />
                            <Label htmlFor="client_proposal_accepted">Al aceptar la propuesta (enviar PDF de aprobación).</Label>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-8">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><Users className="h-5 w-5" />Notificaciones Internas (a usuarios asignados)</h3>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="internal_new_proposal" checked={settings.internal_notifications.new_proposal} onCheckedChange={() => handleCheckboxChange('internal_notifications', 'new_proposal')} />
                            <Label htmlFor="internal_new_proposal">Crear una nueva propuesta.</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="internal_proposal_accepted" checked={settings.internal_notifications.proposal_accepted} onCheckedChange={() => handleCheckboxChange('internal_notifications', 'proposal_accepted')} />
                            <Label htmlFor="internal_proposal_accepted">Cuando el cliente acepta la propuesta.</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="internal_new_job" checked={settings.internal_notifications.new_job} onCheckedChange={() => handleCheckboxChange('internal_notifications', 'new_job')} />
                            <Label htmlFor="internal_new_job">Cuando se crea un trabajo nuevo.</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="internal_new_task" checked={settings.internal_notifications.new_task} onCheckedChange={() => handleCheckboxChange('internal_notifications', 'new_task')} />
                            <Label htmlFor="internal_new_task">Cuando se crea una tarea nueva.</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="internal_new_lead" checked={settings.internal_notifications.new_lead} onCheckedChange={() => handleCheckboxChange('internal_notifications', 'new_lead')} />
                            <Label htmlFor="internal_new_lead">Cuando llegan leads nuevos.</Label>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />Guardar Cambios</Button>
            </CardFooter>
        </Card>
    );
};

export default NotificationSettings;