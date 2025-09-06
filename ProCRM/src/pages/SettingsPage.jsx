
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Upload, Info, Mail, Send, Key, Server, Hash, User, Building, FileText, Users as UsersIcon, Link as LinkIcon, Briefcase, Copy, Trash2, Shield, UserCog, Edit, Save, Pencil } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PasswordInput } from '@/components/ui/password-input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const SettingsPage = () => {
  const { user, profile, fetchProfile } = useAuth();
  const { toast } = useToast();
  const [invitedEmail, setInvitedEmail] = useState('');
  const [uploading, setUploading] = useState(false);
  const termsFileRef = useRef(null);
  const contractFileRef = useRef(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  
  const [isEditingCompanyInfo, setIsEditingCompanyInfo] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({ name: '', ruc: '', address: '', phone: '' });
  const [domain, setDomain] = useState('');

  const [brevoSettings, setBrevoSettings] = useState({
    brevo_api_key: '', brevo_smtp_host: '', brevo_smtp_port: '', brevo_smtp_user: '', brevo_smtp_pass: '',
  });
  
  const [webhookUrl, setWebhookUrl] = useState('');

  const fetchSettingsAndUsers = useCallback(async () => {
    if (!profile || !user) return;
    
    setCompanyInfo(profile.company_info || { name: '', ruc: '', address: '', phone: '' });
    if(!profile.company_info?.name) {
      setIsEditingCompanyInfo(true);
    }

    const { data, error } = await supabase.from('settings').select('*').eq('user_id', user.id).maybeSingle();
    
    if (error && error.code !== 'PGRST116') console.error("Error fetching settings:", error);
    
    if (data) {
      setBrevoSettings(prev => ({ ...prev, brevo_api_key: data.brevo_api_key || '', brevo_smtp_host: data.brevo_smtp_host || '', brevo_smtp_port: data.brevo_smtp_port || '', brevo_smtp_user: data.brevo_smtp_user || '' }));
      setDomain(data.domain || '');
      if (data.domain) {
        setWebhookUrl(`https://${data.domain}/api/leads`);
      }
    }

    if (profile.account_id) {
        const { data: usersData, error: usersError } = await supabase.rpc('get_users_for_account', { acc_id: profile.account_id });

        if(usersError) {
            toast({title: 'Error', description: 'No se pudieron cargar los usuarios.', variant: 'destructive'});
        } else {
            setActiveUsers(usersData || []);
        }
    }

  }, [user, profile, toast]);

  useEffect(() => {
    if (profile) {
      fetchSettingsAndUsers();
    }
  }, [profile, fetchSettingsAndUsers]);

  const handleSaveGeneralInfo = async () => {
    if (!user) return;
    const { error: profileError } = await supabase.from('profiles').update({ company_info: companyInfo }).eq('id', user.id);
    const { error: settingsError } = await supabase.from('settings').upsert({ user_id: user.id, domain: domain }, { onConflict: 'user_id' });

    if (profileError || settingsError) {
        toast({ title: 'Error', description: 'No se pudo guardar la información general.', variant: 'destructive' });
    } else {
        toast({ title: 'Éxito', description: 'Información general guardada.' });
        fetchProfile(user.id); // This re-fetches profile, which will trigger fetchSettingsAndUsers
        setIsEditingCompanyInfo(false);
    }
  };

  const handleSaveBrevoSettings = async () => {
    if (!user) return;
    const { brevo_smtp_pass, ...settingsToSave } = brevoSettings;
    const payload = {
      user_id: user.id,
      brevo_api_key: settingsToSave.brevo_api_key,
      brevo_smtp_host: settingsToSave.brevo_smtp_host,
      brevo_smtp_port: settingsToSave.brevo_smtp_port === '' ? null : parseInt(settingsToSave.brevo_smtp_port, 10),
      brevo_smtp_user: settingsToSave.brevo_smtp_user,
    };
    const { error } = await supabase.from('settings').upsert(payload, { onConflict: 'user_id' });
    if (error) {
      toast({ title: 'Error', description: `No se pudo guardar la configuración de Brevo. ${error.message}`, variant: 'destructive' });
      return;
    }
    toast({ title: 'Éxito', description: 'Configuración de correo guardada correctamente.' });
  };
  
  const sendTestEmail = async () => {
    if (!user) return;
    toast({ title: 'Enviando...', description: 'Se está enviando el correo de prueba.'});
    const { error } = await supabase.functions.invoke('send-test-email', { body: { userId: user.id, userEmail: user.email } });
    if (error) {
       toast({ title: 'Error', description: `No se pudo enviar el correo de prueba: ${error.message}`, variant: 'destructive' });
    } else {
       toast({ title: '¡Correo Enviado!', description: `Se ha enviado un correo de prueba a ${user.email}.` });
    }
  };

  const handleInviteUser = async () => {
    if (!invitedEmail) return;
    const { data, error } = await supabase.functions.invoke('invite-user', { body: { invited_email: invitedEmail } });
    
    if (error) {
      toast({ title: 'Error', description: `No se pudo enviar la invitación: ${error.message}`, variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: data.message });
      setInvitedEmail('');
      fetchSettingsAndUsers();
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if(error) {
        toast({title: 'Error', description: 'No se pudo actualizar el rol del usuario.', variant: 'destructive'});
    } else {
        toast({title: 'Éxito', description: 'Rol de usuario actualizado.'});
        fetchSettingsAndUsers();
        setEditingUser(null);
    }
  };

  const handleDeleteUser = async (userIdToDelete) => {
    if(userIdToDelete === user.id) {
        toast({title: 'Error', description: 'No puedes eliminar tu propia cuenta.', variant: 'destructive'});
        return;
    }
    const { error } = await supabase.functions.invoke('delete-user', { body: { user_id: userIdToDelete } });
    if(error) {
        toast({title: 'Error', description: `No se pudo eliminar el usuario: ${error.message}`, variant: 'destructive'});
    } else {
        toast({title: 'Éxito', description: 'Usuario eliminado correctamente.'});
        fetchSettingsAndUsers();
    }
  };
  
  const handleFileUpload = async (event, fileType) => {
    try {
        setUploading(true);
        const file = event.target.files[0];
        if (!file) throw new Error('Debes seleccionar un archivo.');
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${fileType}-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        let { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
        const updateField = fileType === 'logo' ? 'logo_url' : (fileType === 'terms' ? 'terms_and_conditions_url' : 'contract_template_url');
        const { error: dbError } = await supabase.from('profiles').update({ [updateField]: publicUrl }).eq('id', user.id);
        if (dbError) throw dbError;

        toast({ title: 'Éxito', description: `${fileType === 'logo' ? 'Logo' : 'Documento'} subido correctamente.` });
        fetchProfile(user.id);
    } catch (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
        setUploading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({ title: 'Copiado', description: 'URL del webhook copiada al portapapeles.' });
  }
  
  const roleDisplay = { admin: 'Admin', supervisor: 'Supervisor', coordinador: 'Coordinador' };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold text-gray-800">Configuración</h1>
        <p className="text-muted-foreground text-lg">Gestiona la configuración de tu cuenta y empresa.</p>
      </motion.div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general"><Building className="h-4 w-4 mr-2"/>General</TabsTrigger>
          <TabsTrigger value="email"><Mail className="h-4 w-4 mr-2"/>Correo</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="h-4 w-4 mr-2"/>Documentos</TabsTrigger>
          <TabsTrigger value="leads"><Briefcase className="h-4 w-4 mr-2"/>Leads</TabsTrigger>
          <TabsTrigger value="users"><UsersIcon className="h-4 w-4 mr-2"/>Usuarios</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Información de la Empresa</CardTitle>
                <CardDescription>Configura los datos de tu empresa y personaliza tu marca.</CardDescription>
              </div>
              {!isEditingCompanyInfo && (
                <Button variant="outline" size="sm" onClick={() => setIsEditingCompanyInfo(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditingCompanyInfo ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Nombre de la Empresa</Label><Input value={companyInfo.name || ''} onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})} placeholder="Tu Empresa S.A."/></div>
                    <div><Label>RUC / ID Fiscal</Label><Input value={companyInfo.ruc || ''} onChange={(e) => setCompanyInfo({...companyInfo, ruc: e.target.value})} placeholder="123456789"/></div>
                    <div><Label>Dirección</Label><Input value={companyInfo.address || ''} onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})} placeholder="Calle Principal 123"/></div>
                    <div><Label>Teléfono</Label><Input value={companyInfo.phone || ''} onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})} placeholder="+123 456 7890"/></div>
                  </div>
                  <div className="space-y-2">
                    <Label>Dominio de la App</Label>
                    <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="app.tuempresa.com"/>
                    <p className="text-xs text-muted-foreground">Este dominio se usará para generar la URL del Webhook para leads.</p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsEditingCompanyInfo(false)}>Cancelar</Button>
                    <Button onClick={handleSaveGeneralInfo}><Save className="h-4 w-4 mr-2" />Guardar Información</Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <div><p className="text-sm font-medium text-muted-foreground">Nombre de la Empresa</p><p>{companyInfo.name || 'No especificado'}</p></div>
                        <div><p className="text-sm font-medium text-muted-foreground">RUC / ID Fiscal</p><p>{companyInfo.ruc || 'No especificado'}</p></div>
                        <div><p className="text-sm font-medium text-muted-foreground">Dirección</p><p>{companyInfo.address || 'No especificado'}</p></div>
                        <div><p className="text-sm font-medium text-muted-foreground">Teléfono</p><p>{companyInfo.phone || 'No especificado'}</p></div>
                        <div><p className="text-sm font-medium text-muted-foreground">Dominio de la App</p><p>{domain || 'No especificado'}</p></div>
                    </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="mt-6">
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" />Conexión de Correo</CardTitle><CardDescription>Conecta Brevo para enviar notificaciones y propuestas por email.</CardDescription></CardHeader>
                <CardContent>
                <Tabs defaultValue="api" className="w-full">
                    <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="smtp">SMTP</TabsTrigger><TabsTrigger value="api">API</TabsTrigger></TabsList>
                    <TabsContent value="smtp" className="mt-6 space-y-4"><p className="text-sm text-muted-foreground">Configura los detalles de tu servidor SMTP para el envío de correos. (Menos recomendado)</p><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label htmlFor="smtp_host" className="flex items-center gap-2"><Server className="h-4 w-4"/>Host SMTP</Label><Input id="smtp_host" value={brevoSettings.brevo_smtp_host} onChange={e => setBrevoSettings({...brevoSettings, brevo_smtp_host: e.target.value})} placeholder="smtp-relay.brevo.com" /></div><div><Label htmlFor="smtp_port" className="flex items-center gap-2"><Hash className="h-4 w-4"/>Puerto</Label><Input id="smtp_port" type="number" value={brevoSettings.brevo_smtp_port} onChange={e => setBrevoSettings({...brevoSettings, brevo_smtp_port: e.target.value})} placeholder="587" /></div><div><Label htmlFor="smtp_user" className="flex items-center gap-2"><User className="h-4 w-4"/>Usuario</Label><Input id="smtp_user" value={brevoSettings.brevo_smtp_user} onChange={e => setBrevoSettings({...brevoSettings, brevo_smtp_user: e.target.value})} placeholder="tu@email.com" /></div><div><Label htmlFor="smtp_pass" className="flex items-center gap-2"><Key className="h-4 w-4"/>Clave Maestra</Label><PasswordInput id="smtp_pass" value={brevoSettings.brevo_smtp_pass} onChange={e => setBrevoSettings({...brevoSettings, brevo_smtp_pass: e.target.value})} placeholder="••••••••••••" /></div></div></TabsContent>
                    <TabsContent value="api" className="mt-6 space-y-4"><p className="text-sm text-muted-foreground">Usa tu clave API para una integración más robusta y recomendada.</p><div><Label htmlFor="api_key" className="flex items-center gap-2"><Key className="h-4 w-4"/>Clave API v3 de Brevo</Label><PasswordInput id="api_key" value={brevoSettings.brevo_api_key} onChange={e => setBrevoSettings({...brevoSettings, brevo_api_key: e.target.value})} placeholder="xkeysib-..." /></div><div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md" role="alert"><div className="flex"><div className="py-1"><Info className="h-5 w-5 text-blue-500 mr-3" /></div><div><p className="font-bold">IPs para Lista de Confianza</p><p className="text-sm mt-1">Para mayor seguridad, añade las siguientes IPs a tu lista de confianza en Brevo:</p><p className="font-mono bg-blue-100 px-2 py-1 rounded mt-2 text-sm">IPv4: 3.211.47.163</p><p className="font-mono bg-blue-100 px-2 py-1 rounded mt-2 text-sm">IPv6: 2600:1f18:2479:b000:a1a9:794c:d51c:a1b3</p></div></div></div></TabsContent>
                </Tabs>
                <div className="flex items-center gap-4 mt-6 pt-6 border-t"><Button onClick={handleSaveBrevoSettings} className="flex-1">Guardar Configuración de Correo</Button><Button onClick={sendTestEmail} variant="outline" className="flex-1"><Send className="mr-2 h-4 w-4" />Enviar Correo de Prueba</Button></div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Plantillas y Documentos</CardTitle><CardDescription>Sube tus términos y condiciones y plantillas de contrato.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Términos y Condiciones (PDF)</Label>
                {profile?.terms_and_conditions_url && <a href={profile.terms_and_conditions_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2"><LinkIcon className="h-4 w-4" />Ver documento actual</a>}
                <div className="flex items-center gap-4 mt-2"><Button variant="outline" onClick={() => termsFileRef.current.click()} disabled={uploading}><Upload className="mr-2 h-4 w-4" />{uploading ? 'Subiendo...' : 'Subir Nuevo'}</Button></div>
                <Input type="file" ref={termsFileRef} onChange={(e) => handleFileUpload(e, 'terms')} className="hidden" accept=".pdf" />
              </div>
              <div className="space-y-2">
                <Label>Plantilla de Contrato (DOCX)</Label>
                {profile?.contract_template_url && <a href={profile.contract_template_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2"><LinkIcon className="h-4 w-4" />Ver plantilla actual</a>}
                <div className="flex items-center gap-4 mt-2"><Button variant="outline" onClick={() => contractFileRef.current.click()} disabled={uploading}><Upload className="mr-2 h-4 w-4" />{uploading ? 'Subiendo...' : 'Subir Nueva'}</Button></div>
                <Input type="file" ref={contractFileRef} onChange={(e) => handleFileUpload(e, 'contract')} className="hidden" accept=".doc,.docx" />
                <p className="text-xs text-muted-foreground mt-2">La plantilla se modificará automáticamente con la info del cliente y servicio.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-primary" />Integración de Leads</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Usa la siguiente URL de Webhook para enviar leads desde tus formularios (ej. Elementor, Webflow, etc.).</p>
              {webhookUrl ? (<div className="flex items-center gap-2 p-3 rounded-md bg-secondary"><span className="text-primary font-mono text-sm break-all">{webhookUrl}</span><Button variant="ghost" size="icon" onClick={copyToClipboard}><Copy className="h-4 w-4" /></Button></div>) : (<p className="text-destructive">Por favor, configura tu dominio en la pestaña General para generar la URL del webhook.</p>)}
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
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Gestionar Usuarios</CardTitle><CardDescription>Invita y administra los usuarios de tu cuenta.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-4"><div className="flex-1"><Label htmlFor="invite">Correo electrónico a invitar</Label><Input id="invite" type="email" value={invitedEmail} onChange={(e) => setInvitedEmail(e.target.value)} placeholder="nuevo.usuario@ejemplo.com" /></div><Button onClick={handleInviteUser}>Enviar Invitación</Button></div>
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-2">Usuarios Activos</h4>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activeUsers.map(u => (
                            <TableRow key={u.id}>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>
                                    {editingUser === u.id ? (
                                        <Select defaultValue={u.role} onValueChange={(newRole) => handleUpdateUserRole(u.id, newRole)}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Seleccionar rol" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin"><Shield className="h-4 w-4 mr-2 inline-block"/>Admin</SelectItem>
                                                <SelectItem value="supervisor"><UserCog className="h-4 w-4 mr-2 inline-block"/>Supervisor</SelectItem>
                                                <SelectItem value="coordinador"><User className="h-4 w-4 mr-2 inline-block"/>Coordinador</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            {u.role === 'admin' && <Shield className="h-4 w-4 text-primary" />}
                                            {u.role === 'supervisor' && <UserCog className="h-4 w-4 text-yellow-600" />}
                                            {u.role === 'coordinador' && <User className="h-4 w-4 text-gray-500" />}
                                            {roleDisplay[u.role]}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {user.id !== u.id && profile?.role === 'admin' && (
                                        <>
                                        {editingUser === u.id ? (
                                            <Button variant="ghost" size="icon" onClick={() => setEditingUser(null)}>Cancelar</Button>
                                        ) : (
                                            <Button variant="ghost" size="icon" onClick={() => setEditingUser(u.id)}><Edit className="h-4 w-4"/></Button>
                                        )}
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro de eliminar este usuario?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción es irreversible y eliminará al usuario de tu cuenta.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteUser(u.id)}>Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;