import { Eye, EyeOff, DollarSign, Users, TrendingUp, Building2, Activity, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  isBlurred?: boolean;
  showEyeIcon?: boolean;
  onToggleBlur?: () => void;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: 'revenue' | 'clients' | 'growth' | 'company' | 'activity' | 'alert';
}

const truncateText = (text: string, maxLength: number = 30) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

const getIcon = (type?: MetricCardProps['icon']) => {
  switch (type) {
    case 'revenue':
      return <DollarSign className="h-5 w-5 text-blue-600" />;
    case 'clients':
      return <Users className="h-5 w-5 text-purple-600" />;
    case 'growth':
      return <TrendingUp className="h-5 w-5 text-green-600" />;
    case 'company':
      return <Building2 className="h-5 w-5 text-orange-600" />;
    case 'activity':
      return <Activity className="h-5 w-5 text-indigo-600" />;
    case 'alert':
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    default:
      return null;
  }
};

export function MetricCard({
  title,
  value,
  subValue,
  isBlurred,
  showEyeIcon,
  onToggleBlur,
  trend,
  icon
}: MetricCardProps) {
  const t = useTranslations('dashboard');
  const hasData = value !== undefined && value !== null && value !== '';
  const displayValue = hasData ? value : t('noData');

  return (
    <div className="flex flex-1 flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          {getIcon(icon)}
          <h3 className="truncate text-sm font-medium text-gray-500" title={title}>
            {truncateText(title)}
          </h3>
        </div>
        {showEyeIcon && (
          <div className="cursor-pointer text-gray-400" onClick={onToggleBlur}>
            {isBlurred ? <Eye size={20} /> : <EyeOff size={20} />}
          </div>
        )}
      </div>
      <div className={`mt-2 ${isBlurred ? 'blur-md' : ''}`}>
        <p
          className={`text-2xl font-semibold ${hasData ? 'text-gray-900' : 'text-gray-400'} truncate`}
          title={displayValue.toString()}
        >
          {truncateText(displayValue.toString())}
        </p>
        {subValue && hasData && (
          <p className="truncate text-sm text-gray-600" title={subValue}>
            {truncateText(subValue)}
          </p>
        )}
      </div>
      {trend && hasData && (
        <div className="mt-2">
          <span className={`text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}%
          </span>
        </div>
      )}
    </div>
  );
}
