import { Libraries } from '@react-google-maps/api';
import {
  CheckSquare,
  CircleDollarSign,
  FileBarChartIcon,
  FileText,
  Import,
  ListChecks,
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
    text: 'Quick Start',
    href: '/quickstart',
    icon: PlayCircle,
    title: 'Quick Start Guide',
    description: 'Get started with Aquatechy in a few simple steps'
  },
  {
    text: 'Dashboard',
    href: '/dashboard',
    icon: TabIcon,
    title: 'Dashboard',
    description: 'Overview of your pools as a technician or a manager'
  },
  {
    title: 'Clients',
    text: 'Clients',
    href: '/clients',
    description: 'Manage your clients and edit their information',
    submenu: {
      clients: {
        text: 'My Clients',
        href: '/clients',
        title: 'My Clients'
      },
      addClients: {
        text: 'New Client',
        href: '/clients/new',
        title: 'New Client',
        description: 'Create a new client, add a pool and assign a technician to it',
        icon: UserPlus
      },
      importQuickbooks: {
        text: 'QuickBooks Import',
        href: '/clients/import-quickbooks',
        title: 'Import Clients from QuickBooks',
        icon: Import,
        description: 'Import clients from a QuickBooks file'
      },
      importCSV: {
        text: 'CSV Import',
        href: '/clients/import-csv',
        title: 'Import Clients from CSV',
        icon: Import,
        description: 'Import clients using our CSV template'
      },
      importSkimmer: {
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
    text: 'Routes',
    submenu: {
      routes: {
        text: 'Assignments',
        href: '/routes/assignments',
        title: 'Assignments',
        description: 'Create assignments, manage your routes and see your schedule'
      },
      schedule: {
        text: 'Schedule',
        href: '/routes/schedule',
        title: 'Schedule',
        description: 'See your schedule and the pools you have to service',
        icon: UserPlus
      },
      routeFinder: {
        text: 'Route Finder',
        href: '/routes/route-finder',
        title: 'Route Finder',
        description: 'Find the best route for a new pool location',
        icon: RouteIcon
      }
    },
    href: '/routes/assignments',
    icon: RouteIcon,
    title: 'Assignments',
    description: 'Create assignments, manage your routes and see your schedule'
  },
  {
    text: 'Requests',
    href: '/requests',
    icon: CheckSquare,
    title: 'Requests',
    description: 'Manage your requests and see their status'
  },
  {
    text: 'Services',
    href: '/services',
    icon: ListChecks,
    title: 'Services',
    description: 'Look services made by your company'
  },
  {
    text: 'Invoices',
    href: '/invoices',
    icon: FileText,
    title: 'Invoices',
    description: 'Manage your invoices and track payments',
    submenu: {
      overview: {
        text: 'Overview',
        href: '/invoices',
        title: 'Invoices Overview',
        description: 'View and manage all your invoices'
      },
      estimates: {
        text: 'Estimates',
        href: '/invoices/estimates',
        title: 'Estimates',
        description: 'Create and manage client estimates'
      },
      recurring: {
        text: 'Recurring',
        href: '/invoices/recurring',
        title: 'Recurring Invoices',
        description: 'Manage recurring invoice templates'
      },
      settings: {
        text: 'Settings',
        href: '/invoices/settings',
        title: 'Invoice Settings',
        description: 'Configure invoice settings and preferences'
      }
    }
  },
  {
    text: 'Shopping list',
    href: '/shopping-list/overview',
    icon: ShoppingCart,
    title: 'Shopping list',
    description: 'Manage your product catalog and shopping lists',
    submenu: {
      overview: {
        text: 'Overview',
        href: '/shopping-list/overview',
        title: 'Shopping list overview',
        description: 'Track shopping items across clients and pools'
      },
      products: {
        text: 'Products',
        href: '/shopping-list/products',
        title: 'Products',
        description: 'View and manage products in your catalog'
      }
    }
  },
  {
    text: 'Work Orders',
    href: '/work-orders',
    icon: CheckSquare,
    title: 'Work Orders',
    description: 'Manage work orders and track their progress',
    submenu: {
      overview: {
        text: 'Overview',
        href: '/work-orders/schedule',
        title: 'Work Orders Overview',
        description: 'View and manage work orders',
        icon: Calendar
      },
      add: {
        text: 'Add Work Order',
        href: '/work-orders/add',
        title: 'Add Work Order',
        description: 'Create a new work order',
        icon: ClipboardList
      }
    }
  },
  {
    text: 'Reports',
    href: '/reports',
    icon: FileBarChartIcon,
    title: 'Reports',
    description: 'Generate comprehensive reports and analytics',
    submenu: {
      clientReports: {
        text: 'Client Reports',
        href: '/reports/clients',
        title: 'Client Reports',
        description: 'Client activity and pool maintenance reports',
        icon: Users
      },
      serviceReports: {
        text: 'Service Reports',
        href: '/reports/services',
        title: 'Service Reports',
        description: 'Service completion and technician reports',
        icon: ListChecks
      },
      teamReports: {
        text: 'Team Reports',
        href: '/reports/team',
        title: 'Team Reports',
        description: 'Team performance and productivity reports',
        icon: UserPlus
      },
      poolReports: {
        text: 'Pool Reports',
        href: '/reports/pools',
        title: 'Pool Reports',
        description: 'Pool equipment and filter maintenance reports',
        icon: Waves
      }
    }
  },

  {
    text: 'Settings',
    href: '/settings',
    icon: Cog,
    title: 'Settings',
    submenu: {
      profile: {
        text: 'Profile',
        href: '/settings/profile',
        title: 'Profile'
      },
      subscription: {
        text: 'Subscription',
        href: '/settings/subscription',
        title: 'Subscription',
        description: 'Manage your subscription and see our plans'
      },
      preferences: {
        text: 'Preferences',
        href: '/settings/preferences',
        title: 'Preferences',
        description: 'Manage company preference settings.'
      },
      companies: {
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

export const Categories = [
  
  {
    value: 'other',
    name: 'Other',
    key: 'other'
  },
  {
    value: 'filterCleaning',
    name: 'Filter Cleaning',
    key: 'filterCleaning'
  },
  {
    value: 'filterReplacement',
    name: 'Filter Replacement',
    key: 'filterReplacement'
  }
];

export const libraries: Libraries = ['places'];
