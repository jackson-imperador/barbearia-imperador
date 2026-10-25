'use client';
import * as React from 'react';
import { AppointmentCard } from '@/components/scheduling/AppointmentCard';
import { api } from '@/lib/api';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      // Endpoint is now just /appointments. 
      // The backend will automatically infer isCustomer based on the user's roles in their JWT token.
      const res = await api.get('/appointments');
      setAppointments(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
      try {
        await api.patch(`/appointments/${id}/status`, { status: 'CANCELLED' });
        fetchAppointments();
      } catch (err) {
        alert('Erro ao cancelar agendamento. Pode estar fora do prazo permitido.');
      }
    }
  };

  if (loading) return <div className="text-center p-12 uppercase tracking-widest text-xs text-muted-foreground">Carregando...</div>;

  const upcoming = appointments.filter(a => (a.status === 'PENDING' || a.status === 'CONFIRMED') && new Date(a.startDateTime) >= new Date());
  const history = appointments.filter(a => a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'NO_SHOW' || new Date(a.startDateTime) < new Date());

  return (
    <div className="container mx-auto px-0 md:px-4 py-8 max-w-5xl">
      <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-widest mb-10 text-primary-foreground">Meus Agendamentos</h1>
      
      <div className="mb-12">
        <h2 className="text-sm font-bold text-primary-foreground uppercase tracking-widest border-b border-border pb-4 mb-6">Próximos</h2>
        <div className="space-y-4">
          {upcoming.length > 0 ? upcoming.map(apt => (
            <AppointmentCard key={apt.id} appointment={apt} onCancel={handleCancel} />
          )) : (
            <p className="text-muted-foreground text-sm">Nenhum agendamento futuro.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-4 mb-6">Histórico</h2>
        <div className="space-y-4 opacity-80">
          {history.length > 0 ? history.map(apt => (
            <AppointmentCard key={apt.id} appointment={apt} onCancel={handleCancel} />
          )) : (
            <p className="text-muted-foreground text-sm">Nenhum histórico encontrado.</p>
          )}
        </div>
      </div>
    </div>
  );
}
