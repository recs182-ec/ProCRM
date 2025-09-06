
import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FileSignature, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import SignatureCanvas from 'react-signature-canvas';

const ProposalActions = ({ onApprove, isApproved, isRejected, termsUrl, contractUrl }) => {
  const signatureRef = useRef(null);
  const [signatureName, setSignatureName] = useState('');
  const [signatureEmail, setSignatureEmail] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);

  const clearSignature = () => {
    signatureRef.current.clear();
    setIsSignatureEmpty(true);
  };
  
  const handleApprove = () => {
    if (signatureRef.current.isEmpty()) {
       setIsSignatureEmpty(true);
       return;
    }
    const signatureData = signatureRef.current.getTrimmedCanvas().toDataURL('image/png');
    onApprove(signatureData, signatureName, signatureEmail);
  }

  const isApproveDisabled = !signatureName || !signatureEmail || !agreedToTerms || isSignatureEmpty;

  if (isApproved || isRejected) return null;

  return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="bg-white border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <FileSignature className="h-5 w-5" />
              Aprobación y Firma
            </CardTitle>
            <CardDescription>
              Completa tus datos y firma en el área de abajo para aprobar la propuesta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="signerName">Nombre Completo</Label>
                  <Input id="signerName" value={signatureName} onChange={(e) => setSignatureName(e.target.value)} placeholder="Ej: Juan Pérez" />
                </div>
                <div>
                  <Label htmlFor="signerEmail">Correo Electrónico</Label>
                  <Input id="signerEmail" type="email" value={signatureEmail} onChange={(e) => setSignatureEmail(e.target.value)} placeholder="juan.perez@ejemplo.com" />
                </div>
            </div>
            
            <div className="border rounded-lg bg-gray-50">
              <SignatureCanvas
                ref={signatureRef}
                penColor='black'
                canvasProps={{ className: 'w-full h-48 cursor-crosshair' }}
                onEnd={() => setIsSignatureEmpty(signatureRef.current.isEmpty())}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={clearSignature} variant="outline" size="sm">Limpiar Firma</Button>
            </div>
            
            {(termsUrl || contractUrl) && (
              <div className="space-y-2 rounded-md border p-4">
                 <h4 className="font-medium text-sm">Documentación Importante</h4>
                 <div className="flex flex-col space-y-2">
                    {termsUrl && <a href={termsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2"><FileText className="h-4 w-4"/>Leer Términos y Condiciones</a>}
                    {contractUrl && <a href={contractUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2"><FileText className="h-4 w-4"/>Leer Borrador del Contrato</a>}
                 </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={setAgreedToTerms} />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Acepto los términos y condiciones de los servicios.
              </label>
            </div>

            <Button onClick={handleApprove} disabled={isApproveDisabled} className="w-full" size="lg">
              Aprobar Propuesta
            </Button>
            
          </CardContent>
        </Card>
      </motion.div>
  );
};

export default ProposalActions;
