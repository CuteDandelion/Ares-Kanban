import { AgentDashboard } from '@/components/agents/AgentDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agent Dashboard | Ares Kanban',
  description: 'Monitor agents, submit tasks, and view task progress',
};

export default function AgentsPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <AgentDashboard />
    </main>
  );
}
