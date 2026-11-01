export type ImageFile = {
  dataURL: string;
  file: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
    lastModifiedDate: Date;
    webkitRelativePath: string;
  };
};

export type SelectOption = {
  value: string;
  name: string;
  key: string;
};

export type MenuLink = {
  i18nKey: string;
  text: string;
  href: string;
  title: string;
  description?: string;
  icon?: React.FC;
};

export type Menu = MenuLink & {
  submenu?: Record<string, MenuLink>;
  icon: React.FC;
};
