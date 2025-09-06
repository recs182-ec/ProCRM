
import React from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, Percent, MinusCircle, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ProposalPDF from '@/components/proposal/ProposalPDF';

const ProposalSummary = ({ proposal, selectedServices, isApproved, isRejected, logoUrl }) => {

  const subtotal = proposal?.services
    ?.filter(service => (isApproved ? proposal.approved_services || selectedServices : selectedServices).includes(service.id))
    .reduce((total, service) => total + (Number(service.price) || 0), 0) || 0;

  const discountPercentage = proposal.discount || 0;
  const discountAmount = subtotal * (discountPercentage / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const iva = subtotalAfterDiscount * 0.15;
  const total = subtotalAfterDiscount + iva;

  const selectedServiceDetails = proposal.services?.filter(s => 
    (isApproved ? proposal.approved_services || selectedServices : selectedServices).includes(s.id)
  ) || [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-6">
      <Card className="bg-white border sticky top-6">
        <CardHeader>
          <CardTitle className="text-gray-800">Resumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Creada: {new Date(proposal.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Servicios Seleccionados:</h4>
            {selectedServiceDetails.map(service => (
              <div key={service.id} className="flex justify-between text-sm">
                <span>{service.name}</span>
                <span>${(Number(service.price) || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            ))}
             {selectedServiceDetails.length === 0 && <p className="text-sm text-muted-foreground">Ningún servicio seleccionado.</p>}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
             <div className="flex justify-between text-sm items-center">
              <div className="flex items-center gap-1"><MinusCircle className="h-4 w-4 text-red-500" /><span>Descuento ({discountPercentage}%):</span></div>
              <span>-${discountAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
             <div className="flex justify-between text-sm items-center">
               <div className="flex items-center gap-1"><PlusCircle className="h-4 w-4 text-green-500" /><span>IVA (15%):</span></div>
              <span>${iva.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span className="text-primary">${total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </div>
          
          {(isApproved || isRejected) && proposal && (
            <div className="pt-4">
              <PDFDownloadLink
                document={<ProposalPDF proposal={proposal} logoUrl={logoUrl} />}
                fileName={`propuesta-${proposal.id}.pdf`}
                className="w-full"
              >
                {({ loading }) => (
                  <Button variant="outline" className="w-full" disabled={loading}>
                    <Download className="h-4 w-4 mr-2" />
                    {loading ? 'Generando PDF...' : 'Descargar PDF'}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProposalSummary;
