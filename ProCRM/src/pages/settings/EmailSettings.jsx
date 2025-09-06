
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Mail, Send, Key, Info } from 'lucide-react';
import { PasswordInput } from '@/components/ui/password-input';

const EmailSettings = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [brevoApiKey, setBrevoApiKey] = useState('');
    const [senderEmail, setSenderEmail] = useState('');

    const loadSettings = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('settings').select('brevo_api_key, brevo_smtp_user').eq('user_id', user.id).single();
        if (data) {
            setBrevoApiKey(data.brevo_api_key || '');
            setSenderEmail(data.brevo_smtp_user || '');
        }
    }, [user]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleSave = async () => {
        if (!user) return;
        const { error } = await supabase.from('settings').upsert({
            user_id: user.id,
            brevo_api_key: brevoApiKey,
            brevo_smtp_user: senderEmail
        }, { onConflict: 'user_id' });
        
        if (error) {
            toast({ title: 'Error', description: `No se pudo guardar la configuración de Brevo. ${error.message}`, variant: 'destructive' });
        } else {
            toast({ title: 'Éxito', description: 'Configuración de correo guardada correctamente.' });
        }
    };

    const sendTestEmail = async () => {
        if (!user || !user.email) return;
        toast({ title: 'Enviando...', description: 'Se está enviando el correo de prueba.' });
        const { error } = await supabase.functions.invoke('send-test-email', { body: { userId: user.id, userEmail: user.email } });
        if (error) {
            toast({ title: 'Error', description: `No se pudo enviar el correo de prueba: ${error.message}`, variant: 'destructive' });
        } else {
            toast({ title: '¡Correo Enviado!', description: `Se ha enviado un correo de prueba a ${user.email}.` });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" />Conexión de Correo</CardTitle>
                <CardDescription>Conecta Brevo (Sendinblue) para enviar notificaciones y propuestas por email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label htmlFor="sender_email" className="flex items-center gap-2">Email Remitente</Label>
                    <Input id="sender_email" value={senderEmail} onChange={e => setSenderEmail(e.target.value)} placeholder="tu@email.com" />
                    <p className="text-xs text-muted-foreground mt-1">Debe ser el mismo email de tu cuenta de Brevo.</p>
                </div>
                <div>
                    <Label htmlFor="api_key" className="flex items-center gap-2"><Key className="h-4 w-4"/>Clave API v3 de Brevo</Label>
                    <PasswordInput id="api_key" value={brevoApiKey} onChange={e => setBrevoApiKey(e.target.value)} placeholder="xkeysib-..." />
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md" role="alert">
                    <div className="flex">
                        <div className="py-1"><Info className="h-5 w-5 text-blue-500 mr-3" /></div>
                        <div>
                            <p className="font-bold">IPs para Lista de Confianza</p>
                            <p className="text-sm mt-1">Para mayor seguridad, añade las siguientes IPs a tu lista de confianza en Brevo:</p>
                            <p className="font-mono bg-blue-100 px-2 py-1 rounded mt-2 text-sm">IPv4: 3.211.47.163</p>
                            <p className="font-mono bg-blue-100 px-2 py-1 rounded mt-2 text-sm">IPv6: 2600:1f18:2479:b000:a1a9:794c:d51c:a1b3</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 pt-6 border-t">
                    <Button onClick={handleSave} className="flex-1">Guardar Configuración</Button>
                    <Button onClick={sendTestEmail} variant="outline" className="flex-1"><Send className="mr-2 h-4 w-4" />Enviar Correo de Prueba</Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default EmailSettings;
