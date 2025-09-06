import React from 'react';
import { motion } from 'framer-motion';

const ProposalHeader = ({ clientName, clientCompany, logoUrl }) => {
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
      <div className="mb-6 h-24 flex justify-center items-center">
        {logoUrl ? (
           <img src={logoUrl} alt="Company Logo" className="max-h-full max-w-xs" />
        ) : (
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-500">Logo</span>
          </div>
        )}
      </div>
      <h1 className="text-4xl font-bold gradient-text mb-2">Propuesta de Servicios</h1>
      <p className="text-muted-foreground text-lg">Para {clientName}</p>
      {clientCompany && <p className="text-muted-foreground">{clientCompany}</p>}
    </motion.div>
  );
};

export default ProposalHeader;