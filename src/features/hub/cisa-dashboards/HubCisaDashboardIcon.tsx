import {
  Building2,
  GitBranch,
  Globe,
  LayoutDashboard,
  Network,
  Shield,
  Users,
} from 'lucide-react'
import type { HubCisaDashboardId } from '@/features/hub/cisa-dashboards/types'

const ICON_CLASS = 'h-4 w-4'

export function HubCisaDashboardIcon({ dashboardId }: { dashboardId: HubCisaDashboardId }) {
  switch (dashboardId) {
    case 'cisa-national-geospatial-cop':
      return <Globe className={ICON_CLASS} />
    case 'cisa-cyber-operations':
      return <Shield className={ICON_CLASS} />
    case 'cisa-fusion-cell':
      return <Network className={ICON_CLASS} />
    case 'cisa-hirt-infrastructure-analysis':
      return <Building2 className={ICON_CLASS} />
    case 'cisa-sector-dependency-consequence':
      return <GitBranch className={ICON_CLASS} />
    case 'cisa-leadership-decision-view':
      return <LayoutDashboard className={ICON_CLASS} />
    case 'interagency-dashboard':
      return <Users className={ICON_CLASS} />
    default:
      return <Globe className={ICON_CLASS} />
  }
}
