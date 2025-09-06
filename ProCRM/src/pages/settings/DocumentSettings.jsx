
import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Upload, Link as LinkIcon } from 'lucide-react';

const DocumentSettings = () => {
    const { user, profile, fetchProfile } = useAuth();
    const { toast } = useToast();
    const [uploading, setUploading] = useState(false);
    const termsFileRef = useRef(null);
    const contractFileRef = useRef(null);
    
    const handleFileUpload = async (event, fileType) => {
        try {
            setUploading(true);
            const file = event.target.files[0];
            if (!file) throw new Error('Debes seleccionar un archivo.');
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${fileType}-${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;
            
            const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
            const updateField = fileType === 'terms' ? 'terms_and_conditions_url' : 'contract_template_url';
            
            const { error: dbError } = await supabase.from('profiles').update({ [updateField]: publicUrl }).eq('id', user.id);
            if (dbError) throw dbError;

            toast({ title: 'Éxito', description: `Documento subido correctamente.` });
            await fetchProfile(user.id);
        } catch (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setUploading(false);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Plantillas y Documentos</CardTitle>
                <CardDescription>Sube tus términos y condiciones y plantillas de contrato.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Términos y Condiciones (PDF)</Label>
                    {profile?.terms_and_conditions_url && <a href={profile.terms_and_conditions_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2"><LinkIcon className="h-4 w-4" />Ver documento actual</a>}
                    <div className="flex items-center gap-4 mt-2">
                        <Button variant="outline" onClick={() => termsFileRef.current.click()} disabled={uploading}><Upload className="mr-2 h-4 w-4" />{uploading ? 'Subiendo...' : 'Subir Nuevo'}</Button>
                    </div>
                    <Input type="file" ref={termsFileRef} onChange={(e) => handleFileUpload(e, 'terms')} className="hidden" accept=".pdf" />
                </div>
                <div className="space-y-2">
                    <Label>Plantilla de Contrato (DOCX)</Label>
                    {profile?.contract_template_url && <a href={profile.contract_template_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2"><LinkIcon className="h-4 w-4" />Ver plantilla actual</a>}
                    <div className="flex items-center gap-4 mt-2">
                        <Button variant="outline" onClick={() => contractFileRef.current.click()} disabled={uploading}><Upload className="mr-2 h-4 w-4" />{uploading ? 'Subiendo...' : 'Subir Nueva'}</Button>
                    </div>
                    <Input type="file" ref={contractFileRef} onChange={(e) => handleFileUpload(e, 'contract')} className="hidden" accept=".doc,.docx" />
                    <p className="text-xs text-muted-foreground mt-2">La plantilla se modificará automáticamente con la info del cliente y servicio.</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default DocumentSettings;
