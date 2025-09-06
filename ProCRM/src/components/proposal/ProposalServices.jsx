import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

const ProposalServices = ({ services, selectedServices, onServiceToggle, isApproved, isRejected }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <Card className="glass-effect border-0">
        <CardHeader>
          <CardTitle>Servicios Propuestos</CardTitle>
          {!isApproved && !isRejected && (
            <p className="text-sm text-muted-foreground">Puedes seleccionar/deseleccionar los servicios que desees</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`service-item rounded-lg p-4 ${selectedServices.includes(service.id) ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedServices.includes(service.id)}
                  onCheckedChange={() => onServiceToggle(service.id)}
                  disabled={isApproved || isRejected}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-2">{service.name}</h4>
                  <p className="text-muted-foreground mb-3">{service.description}</p>
                  <p className="text-2xl font-bold text-green-400">${service.price.toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProposalServices;