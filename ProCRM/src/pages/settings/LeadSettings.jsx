
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Info, Copy } from 'lucide-react';

const LeadSettings = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [webhookUrl, setWebhookUrl] = useState('');

    const loadSettings = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('settings').select('domain').eq('user_id', user.id).single();
        if (data && data.domain) {
            setWebhookUrl(`${window.location.protocol}//${data.domain}/api/leads`);
        } else {
            setWebhookUrl('');
        }
    }, [user]);

    useEffect(() => {
        const channel = supabase.channel('settings-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: `user_id=eq.${user?.id}` },
                (payload) => {
                    loadSettings();
                }
            )
            .subscribe();

        loadSettings();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadSettings, user?.id]);


    const copyToClipboard = () => {
        if (!webhookUrl) return;
        navigator.clipboard.writeText(webhookUrl);
        toast({ title: 'Copiado', description: 'URL del webhook copiada al portapapeles.' });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-primary" />Integración de Leads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground">Usa la siguiente URL de Webhook para enviar leads desde tus formularios (ej. Elementor, Webflow, etc.).</p>
                {webhookUrl ? (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-secondary">
                        <span className="text-primary font-mono text-sm break-all">{webhookUrl}</span>
                        <Button variant="ghost" size="icon" onClick={copyToClipboard}><Copy className="h-4 w-4" /></Button>
                    </div>
                ) : (
                    <p className="text-destructive">Por favor, configura tu dominio en la pestaña General para generar la URL del webhook.</p>
                )}
                <div className="border-t pt-4">
                    <h4 className="font-semibold">Instrucciones</h4>
                    <p className="text-muted-foreground text-sm mt-2">Configura tu formulario para enviar una petición POST a la URL del webhook con un cuerpo JSON. Asegúrate de que los nombres de los campos coincidan:</p>
                    <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1 mt-2 pl-4">
                        <li>`name`: Nombre del contacto</li>
                        <li>`email`: Correo electrónico del contacto</li>
                        <li>`phone`: (Opcional) Teléfono del contacto</li>
                        <li>`website`: (Opcional) Sitio web de la empresa</li>
                        <li>`address`: (Opcional) Dirección o país</li>
                        <li>`notes`: (Opcional) Cualquier nota o mensaje adicional</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
};

export default LeadSettings;
