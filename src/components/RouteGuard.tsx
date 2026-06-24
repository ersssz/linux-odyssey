import { Navigate } from 'react-router';
import { useGame } from '../hooks/useGame';
import { isCampaignComplete } from '../data/campaign';

export function CertificateGuard({ children }: { children: React.ReactNode }) {
  const { state } = useGame();
  if (!isCampaignComplete(state.completed)) {
    return <Navigate to="/learn" replace />;
  }
  return children;
}
