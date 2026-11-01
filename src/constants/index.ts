import { Libraries } from '@react-google-maps/api';
import {
  CheckSquare,
  CircleDollarSign,
  FileBarChartIcon,
  FileText,
  Import,
  ListChecks,
  MessageSquare,
  ShoppingCart,
  Mails,
  Cog,
  UserPlus,
  Users,
  PlayCircle,
  ClipboardList,
  Calendar,
  Waves
} from 'lucide-react';

import { RequestCategory } from '@/ts/enums/enums';

import RouteIcon from '@/components/ui/route-icon';
import TabIcon from '@/components/ui/tab-icon';

import { Frequency } from '@/ts/enums/enums';
import { Menu } from '@/ts/interfaces/Others';

export const Frequencies = [
  {
    value: Frequency.WEEKLY,
    name: 'Weekly',
    key: 'Weekly'
  },
  {
    value: Frequency.E2WEEKS,
    name: 'Each 2 weeks',
    key: 'Each2Weeks'
  },
  {
    value: Frequency.E3WEEKS,
    name: 'Each 3 weeks',
    key: 'Each3Weeks'
  },
  {
    value: Frequency.E4WEEKS,
    name: 'Each 4 weeks',
    key: 'Each4Weeks'
  },
  {
    value: Frequency.ONCE,
    name: 'Only once',
    key: 'OnlyOnce'
  }
];

export const Weekdays = [
  {
    value: 'SUNDAY',
    name: 'Sunday',
    key: 'Sunday'
  },
  {
    value: 'MONDAY',
    name: 'Monday',
    key: 'Monday'
  },
  {
    value: 'TUESDAY',
    name: 'Tuesday',
    key: 'Tuesday'
  },
  {
    value: 'WEDNESDAY',
    name: 'Wednesday',
    key: 'Wednesday'
  },
  {
    value: 'THURSDAY',
    name: 'Thursday',
    key: 'Thursday'
  },
  {
    value: 'FRIDAY',
    name: 'Friday',
    key: 'Friday'
  },
  {
    value: 'SATURDAY',
    name: 'Saturday',
    key: 'Saturday'
  }
];

export const HasSaltSystemOptions = [
  {
    value: 'true',
    name: 'Yes',
    key: 'true'
  },
  {
    value: 'false',
    name: 'No',
    key: 'false'
  }
];

export const PoolTypes = [
  {
    value: 'Chlorine',
    name: 'Chlorine',
    key: 'Chlorine'
  },
  {
    value: 'Salt',
    name: 'Salt',
    key: 'Salt'
  },
  {
    value: 'Other',
    name: 'Other',
    key: 'Other'
  }
];

export const routes: Menu[] = [
  {
    i18nKey: 'quickstart',
    text: 'Quick Start',
    href: '/quickstart',
    icon: PlayCircle,
    title: 'Quick Start Guide',
    description: 'Get started with Aquatechy in a few simple steps'
  },
  {
    i18nKey: 'dashboard',
    text: 'Dashboard',
    href: '/dashboard',
    icon: TabIcon,
    title: 'Dashboard',
    description: 'Overview of your pools as a technician or a manager'
  },
  {
    i18nKey: 'chat',
    text: 'Chat',
    href: '/chat',
    icon: MessageSquare,
    title: 'AI Chat',
    description: 'Ask questions about your company data'
  },
  {
    i18nKey: 'clients',
    title: 'Clients',
    text: 'Clients',
    href: '/clients',
    description: 'Manage your clients and edit their information',
    submenu: {
      clients: {
        i18nKey: 'myClients',
        text: 'My Clients',
        href: '/clients',
        title: 'My Clients'
      },
      leads: {
        i18nKey: 'leads',
        text: 'Leads',
        href: '/clients/leads',
        title: 'Leads',
        description: 'Track leads, schedule one visit, and convert them into clients',
        icon: UserPlus
      },
      addClients: {
        i18nKey: 'newClient',
        text: 'New Client',
        href: '/clients/new',
        title: 'New Client',
        description: 'Create a new client, add a pool and assign a technician to it',
        icon: UserPlus
      },
      importQuickbooks: {
        i18nKey: 'quickbooksImport',
        text: 'QuickBooks Import',
        href: '/clients/import-quickbooks',
        title: 'Import Clients from QuickBooks',
        icon: Import,
        description: 'Import clients from a QuickBooks file'
      },
      importFromFile: {
        i18nKey: 'fileImport',
        text: 'Excel / CSV Import',
        href: '/clients/import-from-file',
        title: 'Import Clients from Excel or CSV',
        icon: Import,
        description: 'Import clients using our Excel or CSV template'
      },
      importSkimmer: {
        i18nKey: 'skimmerImport',
        text: 'Skimmer Import',
        href: '/clients/import-skimmer',
        title: 'Import Clients from Skimmer',
        icon: Import,
        description: 'Import clients from Skimmer Excel file'
      }
    },
    icon: Users
  },
  {
    i18nKey: 'routes',
    text: 'Routes',
    submenu: {
      schedule: {
        i18nKey: 'schedule',
        text: 'Schedule',
        href: '/routes/schedule',
        title: 'Schedule',
        description: 'See your schedule and the pools you have to service',
        icon: UserPlus
      },
      routeFinder: {
        i18nKey: 'routeFinder',
        text: 'Route Finder',
        href: '/routes/route-finder',
        title: 'Route Finder',
        description: 'Find the best route for a new pool location',
        icon: RouteIcon
      }
    },
    href: '/routes/schedule',
    icon: RouteIcon,
    title: 'Routes',
    description: 'See your schedule and find the best route for a new pool location'
  },
  {
    i18nKey: 'requests',
    text: 'Requests',
    href: '/requests',
    icon: CheckSquare,
    title: 'Requests',
    description: 'Manage your requests and see their status'
  },
  {
    i18nKey: 'services',
    text: 'Services',
    href: '/services',
    icon: ListChecks,
    title: 'Services',
    description: 'Look services made by your company'
  },
  {
    i18nKey: 'invoices',
    text: 'Invoices',
    href: '/invoices',
    icon: FileText,
    title: 'Invoices',
    description: 'Manage your invoices and track payments',
    submenu: {
      overview: {
        i18nKey: 'invoicesOverview',
        text: 'Overview',
        href: '/invoices',
        title: 'Invoices Overview',
        description: 'View and manage all your invoices'
      },
      estimates: {
        i18nKey: 'estimates',
        text: 'Estimates',
        href: '/invoices/estimates',
        title: 'Estimates',
        description: 'Create and manage client estimates'
      },
      recurring: {
        i18nKey: 'recurring',
        text: 'Recurring',
        href: '/invoices/recurring',
        title: 'Recurring Invoices',
        description: 'Manage recurring invoice templates'
      },
      settings: {
        i18nKey: 'invoiceSettings',
        text: 'Settings',
        href: '/invoices/settings',
        title: 'Invoice Settings',
        description: 'Configure invoice settings and preferences'
      }
    }
  },
  {
    i18nKey: 'shopping',
    text: 'Shopping list',
    href: '/shopping-list/overview',
    icon: ShoppingCart,
    title: 'Shopping list',
    description: 'Manage your product catalog and shopping lists',
    submenu: {
      overview: {
        i18nKey: 'shoppingOverview',
        text: 'Overview',
        href: '/shopping-list/overview',
        title: 'Shopping list overview',
        description: 'Track shopping items across clients and pools'
      },
      products: {
        i18nKey: 'products',
        text: 'Products',
        href: '/shopping-list/products',
        title: 'Products',
        description: 'View and manage products in your catalog'
      }
    }
  },
  {
    i18nKey: 'workOrders',
    text: 'Work Orders',
    href: '/work-orders',
    icon: CheckSquare,
    title: 'Work Orders',
    description: 'Manage work orders and track their progress',
    submenu: {
      overview: {
        i18nKey: 'workOrdersOverview',
        text: 'Overview',
        href: '/work-orders/schedule',
        title: 'Work Orders Overview',
        description: 'View and manage work orders',
        icon: Calendar
      },
      add: {
        i18nKey: 'addWorkOrder',
        text: 'Add Work Order',
        href: '/work-orders/add',
        title: 'Add Work Order',
        description: 'Create a new work order',
        icon: ClipboardList
      }
    }
  },
  {
    i18nKey: 'reports',
    text: 'Reports',
    href: '/reports',
    icon: FileBarChartIcon,
    title: 'Reports',
    description: 'Generate comprehensive reports and analytics',
    submenu: {
      clientReports: {
        i18nKey: 'clientReports',
        text: 'Client Reports',
        href: '/reports/clients',
        title: 'Client Reports',
        description: 'Client activity and pool maintenance reports',
        icon: Users
      },
      serviceReports: {
        i18nKey: 'serviceReports',
        text: 'Service Reports',
        href: '/reports/services',
        title: 'Service Reports',
        description: 'Service completion and technician reports',
        icon: ListChecks
      },
      teamReports: {
        i18nKey: 'teamReports',
        text: 'Team Reports',
        href: '/reports/team',
        title: 'Team Reports',
        description: 'Team performance and productivity reports',
        icon: UserPlus
      },
      poolReports: {
        i18nKey: 'poolReports',
        text: 'Pool Reports',
        href: '/reports/pools',
        title: 'Pool Reports',
        description: 'Pool equipment and filter maintenance reports',
        icon: Waves
      }
    }
  },

  {
    i18nKey: 'settings',
    text: 'Settings',
    href: '/settings',
    icon: Cog,
    title: 'Settings',
    submenu: {
      profile: {
        i18nKey: 'profile',
        text: 'Profile',
        href: '/settings/profile',
        title: 'Profile'
      },
      subscription: {
        i18nKey: 'subscription',
        text: 'Subscription',
        href: '/settings/subscription',
        title: 'Subscription',
        description: 'Manage your subscription and see our plans'
      },
      preferences: {
        i18nKey: 'preferences',
        text: 'Preferences',
        href: '/settings/preferences',
        title: 'Preferences',
        description: 'Manage company preference settings.'
      },
      companies: {
        i18nKey: 'companies',
        text: 'Companies',
        href: '/settings/companies',
        title: 'Companies',
        description: 'Manage your companies and edit their information.'
      }
    }
  }
];

export const paymentType = [
  {
    key: 'valueFixedByPool',
    value: 'valueFixedByPool',
    name: 'Fixed value by pool'
  },
  {
    key: 'percentageFixedByPool',
    value: 'percentageFixedByPool',
    name: '% fixed by pool'
  },
  { key: 'customized', value: 'customized', name: 'Custom' }
];

export const RequestStatus = [
  {
    value: 'Pending',
    name: 'Pending',
    key: 'Pending'
  },
  {
    value: 'Processing',
    name: 'Processing',
    key: 'Processing'
  },
  {
    value: 'Done',
    name: 'Done',
    key: 'Done'
  },
  {
    value: 'ClientNotified',
    name: 'Client Notified',
    key: 'ClientNotified'
  },
  {
    value: 'WaintingClientApproval',
    name: 'Waiting Client Approval',
    key: 'WaintingClientApproval'
  },
  {
    value: 'ApprovedByClient',
    name: 'Approved by Client',
    key: 'ApprovedByClient'
  },
  {
    value: 'RejectedByClient',
    name: 'Rejected by Client',
    key: 'RejectedByClient'
  }
];

export const Categories = Object.entries(RequestCategory)
  .map(([value, name]) => ({
    key: value,
    value,
    name
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const libraries: Libraries = ['places'];
