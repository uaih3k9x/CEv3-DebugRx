import { Database, FlaskConical } from 'lucide-react';

interface DataSourceBadgeProps {
  isMock: boolean;
}

export default function DataSourceBadge({ isMock }: DataSourceBadgeProps) {
  if (isMock) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
        <FlaskConical className="w-3 h-3" />
        Mock 数据
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
      <Database className="w-3 h-3" />
      实时数据
    </span>
  );
}
