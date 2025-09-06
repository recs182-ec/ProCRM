import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Save, Pencil } from 'lucide-react';

const GeneralSettings = () => {
    const { user, fetchProfile } = useAuth();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState(null);
    const [companyInfo, setCompanyInfo] = useState({
        name: '',
        ruc: '',
        address: '',
        phone: ''
    });
    const [domain, setDomain] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [logoUrl, setLogoUrl] = useState('');
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const loadData = useCallback(async () => {
        if (!user) return;

        const userProfile = await fetchProfile(user.id);
        if (userProfile) {
            setProfile(userProfile);
            const loadedCompanyInfo = userProfile.company_info || { name: '', ruc: '', address: '', phone: '' };
            setCompanyInfo(loadedCompanyInfo);

            if (!loadedCompanyInfo.name) {
                setIsEditing(true);
            } else {
                setIsEditing(false);
            }

            const { data: settingsData, error: settingsError } = await supabase
                .from('settings')
                .select('domain, logo_url')
                .eq('user_id', user.id)
                .maybeSingle();

            if (settingsError) console.error("Error loading settings:", settingsError);
            if (settingsData) {
                setDomain(settingsData.domain || '');
                setLogoUrl(settingsData.logo_url || '');
            }
        }
    }, [user, fetchProfile]);

    useEffect(() => {
        loadData();
    }, [loadData]);


    const handleSave = async () => {
        if (!user) return;

        let newLogoUrl = logoUrl;

        if (logoFile) {
            setUploadingLogo(true);
            const fileExt = logoFile.name.split('.').pop();
            const fileName = `${user.id}-logo-${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('logos').upload(filePath, logoFile, { upsert: true });

            if (uploadError) {
                toast({ title: 'Error', description: `Error al subir el logo: ${uploadError.message}`, variant: 'destructive' });
                setUploadingLogo(false);
                return;
            }
            const { data } = supabase.storage.from('logos').getPublicUrl(filePath);
            newLogoUrl = data.publicUrl;
            setLogoUrl(newLogoUrl);
            setUploadingLogo(false);
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .update({ company_info: companyInfo })
            .eq('id', user.id);

        const { error: settingsError } = await supabase
            .from('settings')
            .upsert({ user_id: user.id, domain, logo_url: newLogoUrl }, { onConflict: 'user_id' });

        if (profileError || settingsError) {
            toast({ title: 'Error', description: 'No se pudo guardar la información general.', variant: 'destructive' });
        } else {
            toast({ title: 'Éxito', description: 'Información general guardada.' });
            await loadData();
            setIsEditing(false);
        }
    };

    if (!profile) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Información de la Empresa</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Cargando...</p>
                </CardContent>
            </Card>
        );
    }

    return <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Información de la Empresa</CardTitle>
                    <CardDescription>Configura los datos de tu empresa y personaliza tu marca.</CardDescription>
                </div>
                {!isEditing && <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                    </Button>}
            </CardHeader>
            <CardContent className="space-y-6">
                {isEditing ? <>
                        <div className="space-y-2">
                           <Label>Logo de la Empresa</Label>
                           {logoUrl && <img src={logoUrl} alt="Logo actual" className="h-16 w-auto mb-2" />}
                           <Input type="file" onChange={e => setLogoFile(e.target.files[0])} accept="image/*" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label>Nombre de la Empresa</Label><Input value={companyInfo.name || ''} onChange={e => setCompanyInfo({
              ...companyInfo,
              name: e.target.value
            })} placeholder="Tu Empresa S.A." /></div>
                            <div><Label>Identificación Fiscal / RUC</Label><Input value={companyInfo.ruc || ''} onChange={e => setCompanyInfo({
              ...companyInfo,
              ruc: e.target.value
            })} placeholder="123456789" /></div>
                            <div><Label>Dirección</Label><Input value={companyInfo.address || ''} onChange={e => setCompanyInfo({
              ...companyInfo,
              address: e.target.value
            })} placeholder="Calle Principal 123" /></div>
                            <div><Label>Teléfono</Label><Input value={companyInfo.phone || ''} onChange={e => setCompanyInfo({
              ...companyInfo,
              phone: e.target.value
            })} placeholder="+123 456 7890" /></div>
                        </div>
                        <div className="space-y-2">
                            <Label>Dominio</Label>
                            <Input value={domain} onChange={e => setDomain(e.target.value)} placeholder="app.tuempresa.com" />
                            <p className="text-xs text-muted-foreground">Este dominio se usará para generar la URL del Webhook para leads.</p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={uploadingLogo}><Save className="h-4 w-4 mr-2" />{uploadingLogo ? 'Guardando...' : 'Guardar'}</Button>
                        </div>
                    </> : <div className="space-y-4">
                        {logoUrl && <div><p className="text-sm font-medium text-muted-foreground">Logo</p><img src={logoUrl} alt="Logo" className="h-16 w-auto" /></div>}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <div><p className="text-sm font-medium text-muted-foreground">Nombre de la Empresa</p><p>{companyInfo.name || 'No especificado'}</p></div>
                            <div><p className="text-sm font-medium text-muted-foreground">Identificación Fiscal / RUC</p><p>{companyInfo.ruc || 'No especificado'}</p></div>
                            <div><p className="text-sm font-medium text-muted-foreground">Dirección</p><p>{companyInfo.address || 'No especificado'}</p></div>
                            <div><p className="text-sm font-medium text-muted-foreground">Teléfono</p><p>{companyInfo.phone || 'No especificado'}</p></div>
                            <div><p className="text-sm font-medium text-muted-foreground">Dominio</p><p>{domain || 'No especificado'}</p></div>
                        </div>
                    </div>}
            </CardContent>
        </Card>;
};
export default GeneralSettings;