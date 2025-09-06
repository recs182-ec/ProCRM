
import React from 'react';
import { motion } from 'framer-motion';
import { Building, Mail, FileText, Briefcase, Users as UsersIcon, Bell } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GeneralSettings from './GeneralSettings';
import EmailSettings from './EmailSettings';
import DocumentSettings from './DocumentSettings';
import LeadSettings from './LeadSettings';
import UserSettings from './UserSettings';
import NotificationSettings from './NotificationSettings';

const SettingsPage = () => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold text-gray-800">Configuración</h1>
        <p className="text-muted-foreground text-lg">Gestiona la configuración de tu cuenta y empresa.</p>
      </motion.div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general"><Building className="h-4 w-4 mr-2"/>General</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2"/>Notificaciones</TabsTrigger>
          <TabsTrigger value="email"><Mail className="h-4 w-4 mr-2"/>Correo</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="h-4 w-4 mr-2"/>Documentos</TabsTrigger>
          <TabsTrigger value="leads"><Briefcase className="h-4 w-4 mr-2"/>Leads</TabsTrigger>
          <TabsTrigger value="users"><UsersIcon className="h-4 w-4 mr-2"/>Usuarios</TabsTrigger>
        </TabsList>

        <motion.div
          key="content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TabsContent value="general" className="mt-6">
            <GeneralSettings />
          </TabsContent>
          <TabsContent value="notifications" className="mt-6">
            <NotificationSettings />
          </TabsContent>
          <TabsContent value="email" className="mt-6">
            <EmailSettings />
          </TabsContent>
          <TabsContent value="documents" className="mt-6">
            <DocumentSettings />
          </TabsContent>
          <TabsContent value="leads" className="mt-6">
            <LeadSettings />
          </TabsContent>
          <TabsContent value="users" className="mt-6">
            <UserSettings />
          </TabsContent>
        </motion.div>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
