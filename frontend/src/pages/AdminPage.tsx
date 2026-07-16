import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Check, X, Trash2, Users } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  is_approved: boolean;
  created_at: string;
}

export function AdminPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, { headers });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const approveUser = async (id: string) => {
    await fetch(`/api/admin/users/${id}/approve`, { method: 'PATCH', headers });
    fetchUsers();
  };

  const rejectUser = async (id: string) => {
    await fetch(`${API_URL}/api/admin/users/${id}/reject`, { method: 'PATCH', headers });
    fetchUsers();
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Excluir este usuario?')) return;
    await fetch(`${API_URL}/api/admin/users/${id}`, { method: 'DELETE', headers });
    fetchUsers();
  };

  const pendingUsers = users.filter(u => !u.is_approved && u.role !== 'admin');
  const approvedUsers = users.filter(u => u.is_approved || u.role === 'admin');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Painel Admin</h1>
            <p className="text-sm text-muted-foreground">Gerenciar usuarios</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Aguardando Aprovacao ({pendingUsers.length})
            </CardTitle>
            <CardDescription>Usuarios que criaram conta e aguardam aprovacao</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum usuario pendente
              </p>
            ) : (
              <div className="space-y-3">
                {pendingUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approveUser(user.id)} className="gap-1">
                        <Check className="w-4 h-4" /> Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => rejectUser(user.id)} className="gap-1">
                        <X className="w-4 h-4" /> Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approved Users */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios Aprovados ({approvedUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {approvedUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.role === 'admin' ? 'success' : 'secondary'}>
                      {user.role}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => rejectUser(user.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteUser(user.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
