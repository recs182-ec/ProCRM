import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const ProposalStatusBanner = ({ status, date }) => {
  if (status !== 'approved' && status !== 'rejected') return null;

  const isApproved = status === 'approved';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`mb-8 p-6 rounded-lg text-center ${
        isApproved ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'
      }`}
    >
      <div className="flex items-center justify-center gap-3 mb-2">
        <CheckCircle className={`h-6 w-6 ${isApproved ? 'text-green-400' : 'text-red-400'}`} />
        <h3 className="text-xl font-bold">{isApproved ? '¡Propuesta Aprobada!' : 'Propuesta Rechazada'}</h3>
      </div>
      <p className="text-muted-foreground">
        {isApproved ? 'Aprobada el' : 'Rechazada el'} {new Date(date).toLocaleDateString()}
      </p>
    </motion.div>
  );
};

export default ProposalStatusBanner;