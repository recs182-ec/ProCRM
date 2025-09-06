import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Trash2, Shield, UserCog, User, Edit } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const UserSettings = () => {
    const { user, fetchProfile } = useAuth();
    const { toast } = useToast();
    const [invitedEmail, setInvitedEmail] = useState('');
    const [activeUsers, setActiveUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const roleDisplay = { admin: 'Admin', supervisor: 'Supervisor', coordinador: 'Coordinador' };

    const fetchUsersAndProfile = useCallback(async () => {
        if (!user) return;
        const userProfile = await fetchProfile(user.id);
        setProfile(userProfile);

        if (!userProfile?.account_id) return;
        
        const { data, error } = await supabase.rpc('get_users_for_account', { acc_id: userProfile.account_id });
        if (error) {
            toast({ title: 'Error', description: 'No se pudieron cargar los usuarios.', variant: 'destructive' });
        } else {
            setActiveUsers(data || []);
        }
    }, [user, fetchProfile, toast]);

    useEffect(() => {
        fetchUsersAndProfile();
    }, [fetchUsersAndProfile]);

    const handleInviteUser = async () => {
        if (!invitedEmail) return;
        const { data, error } = await supabase.functions.invoke('invite-user', { body: { invited_email: invitedEmail } });
        
        if (error) {
            toast({ title: 'Error', description: `No se pudo enviar la invitación: ${error.message}`, variant: 'destructive' });
        } else {
            toast({ title: 'Éxito', description: data.message });
            setInvitedEmail('');
            fetchUsersAndProfile();
        }
    };

    const handleUpdateUserRole = async (userId, newRole) => {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        if(error) {
            toast({title: 'Error', description: 'No se pudo actualizar el rol del usuario.', variant: 'destructive'});
        } else {
            toast({title: 'Éxito', description: 'Rol de usuario actualizado.'});
            fetchUsersAndProfile();
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
            fetchUsersAndProfile();
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestionar Usuarios</CardTitle>
                <CardDescription>Invita y administra los usuarios de tu cuenta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-end gap-4">
                    <div className="flex-1">
                        <Label htmlFor="invite">Correo electrónico a invitar</Label>
                        <Input id="invite" type="email" value={invitedEmail} onChange={(e) => setInvitedEmail(e.target.value)} placeholder="nuevo.usuario@ejemplo.com" />
                    </div>
                    <Button onClick={handleInviteUser}>Enviar Invitación</Button>
                </div>
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
                                                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
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
                                                            <AlertDialogDescription>Esta acción es irreversible y eliminará al usuario de tu cuenta.</AlertDialogDescription>
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
    );
};

export default UserSettings;