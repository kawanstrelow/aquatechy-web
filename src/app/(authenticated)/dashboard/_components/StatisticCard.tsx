import { useTranslations } from 'next-intl';
import { FaCartArrowDown } from 'react-icons/fa';
import { IoMdPersonAdd } from 'react-icons/io';
import { RiMoneyDollarCircleFill } from 'react-icons/ri';
import { TfiMoney } from 'react-icons/tfi';

const types = {
  incomeCompany: {
    color: 'from-blue-600 to-sky-400',
    colorIcon: '#2770ED',
    prefix: '$',
    Icon: RiMoneyDollarCircleFill
  },
  incomeSubcontractor: {
    color: 'from-teal-400 to-yellow-400',
    colorIcon: '#45CB99',
    prefix: '$',
    Icon: FaCartArrowDown
  },
  profit: {
    color: 'from-red-500 to-orange-300',
    colorIcon: '#F1574C',
    prefix: '$',
    Icon: TfiMoney
  },
  clients: {
    color: 'from-purple-700 to-blue-600',
    colorIcon: '#7826CF',
    prefix: '',
    Icon: IoMdPersonAdd
  }
};

type StatisticCardType = 'incomeCompany' | 'incomeSubcontractor' | 'profit' | 'clients';

type Props = {
  type: StatisticCardType;
  value?: number;
};

export default function StatisticCard({ type, value }: Props) {
  const t = useTranslations('dashboard');
  const copy = {
    incomeCompany: { title: t('statistics.income'), subtitle: t('statistics.incomeCompany') },
    incomeSubcontractor: { title: t('statistics.income'), subtitle: t('statistics.incomeSubcontractor') },
    profit: { title: t('statistics.profit'), subtitle: '' },
    clients: { title: t('statistics.clients'), subtitle: '' }
  };
  const Icon = types[type].Icon;
  const displayValue = type.startsWith('income') ? value! / 100 : value;

  return (
    <div className="inline-flex w-full flex-col items-start justify-start gap-4 rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex flex-col items-start justify-start gap-2 self-stretch">
        <div className="inline-flex items-start justify-start gap-1 self-stretch">
          <div className="flex h-6 w-6 items-center justify-center gap-2">
            <Icon color={types[type].colorIcon} size={25} />
          </div>
          <div className="shrink grow basis-0 text-base font-medium leading-normal tracking-tight text-zinc-600">
            {copy[type].title}
            <span className="text-xs">{copy[type].subtitle}</span>
          </div>
        </div>
        <div className="self-stretch text-[32px] font-medium tracking-tight text-neutral-800">
          {types[type].prefix}
          {displayValue}
        </div>
        <div className="flex h-2 flex-col items-start justify-start gap-1 self-stretch">
          <div className="flex h-2 flex-col items-start justify-start gap-2 self-stretch rounded-[100px] bg-gray-100 pr-28">
            <div className={`h-2 w-[90%] rounded-[100px] bg-gradient-to-r ${types[type].color}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
