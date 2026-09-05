export enum LanguageOptions {
  English = 'English',
  Portuguese = 'Portuguese',
  Spanish = 'Spanish'
}

export enum SubcontractorStatus {
  Active = 'Active',
  Inactive = 'Inactive'
}

export enum WeekdaysUppercase {
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY'
}

export enum PoolType {
  Salt = 'Salt',
  Chlorine = 'Chlorine',
  Other = 'Other'
}

export enum FieldType {
  Checkbox = 'checkbox',
  Phone = 'phone',
  Password = 'password',
  Default = 'default',
  TextArea = 'textArea',
  File = 'file',
  Zip = 'zip',
  Date = 'date',
  PercentValue = 'percentValue',
  CurrencyValue = 'currencyValue',
  Switch = 'switch',
  Number = 'number',
  Address = 'address'
}

export enum ClientType {
  Residential = 'Residential',
  Commercial = 'Commercial'
}

export enum UserSubscription {
  FREE = 'FREE',
  GROW = 'GROW'
}

export enum IanaTimeZones {
  NY = 'America/New_York',
  CHICAGO = 'America/Chicago',
  DENVER = 'America/Denver',
  LA = 'America/Los_Angeles',
  ANCHORAGE = 'America/Anchorage',
  ADAK = 'America/Adak',
  HONOLULU = 'Pacific/Honolulu'
}

export enum Frequency {
  WEEKLY = 'WEEKLY',
  E2WEEKS = 'E2WEEKS',
  E3WEEKS = 'E3WEEKS',
  E4WEEKS = 'E4WEEKS',
  ONCE = 'ONCE'
}

export enum FilterType {
  Sand = 'Sand',
  Cartridge = 'Cartridge',
  DE = 'DE',
  Other = 'Other'
}

export enum EquipmentCondition {
  Excellent = 'Excellent',
  Good = 'Good',
  Fair = 'Fair',
  Poor = 'Poor',
  NeedsReplacement = 'NeedsReplacement'
}

export enum MaintenanceType {
  Cleaning = 'Cleaning',
  Inspection = 'Inspection',
  Installation = 'Installation',
  Replacement = 'Replacement',
  Adjustment = 'Adjustment',
  Other = 'Other'
}

export enum RequestCategory {
  equipmentIsLeaking = 'Equipment is leaking',
  filterCartridgeNeedsToBeReplaced = 'Filter cartridge needs to be replaced',
  filterCleaning = 'Filter Cleaning',
  filterNeedsANewORing = 'Filter needs a new O-ring',
  filterReplacement = 'Filter Replacement',
  heaterIsNotWorking = 'Heater is not working',
  other = 'Other',
  poolNeedsANewSkimmerBasket = 'Pool needs a new skimmer basket',
  pumpHasNoPower = 'Pump has no power',
  pumpIsNotPriming = 'Pump is not priming',
  pumpNeedsANewBasket = 'Pump needs a new basket',
  pumpNeedsANewGasket = 'Pump needs a new gasket',
  saltSystemStoppedWorking = 'Salt system stopped working',
  timerHasNoPower = 'Timer has no power',
  waterLevelIsHigh = 'Water level is high',
  waterLevelIsLow = 'Water level is low'
}

export function formatRequestCategory(value: string): string {
  return RequestCategory[value as keyof typeof RequestCategory] ?? value;
}

export const STATE_TIMEZONE_MAP: { [key: string]: IanaTimeZones } = {
  // Eastern Time Zone
  CT: IanaTimeZones.NY,
  DE: IanaTimeZones.NY,
  FL: IanaTimeZones.NY,
  GA: IanaTimeZones.NY,
  MA: IanaTimeZones.NY,
  MD: IanaTimeZones.NY,
  ME: IanaTimeZones.NY,
  NC: IanaTimeZones.NY,
  NH: IanaTimeZones.NY,
  NJ: IanaTimeZones.NY,
  NY: IanaTimeZones.NY,
  PA: IanaTimeZones.NY,
  RI: IanaTimeZones.NY,
  SC: IanaTimeZones.NY,
  VA: IanaTimeZones.NY,
  VT: IanaTimeZones.NY,
  WV: IanaTimeZones.NY,

  // Central Time Zone
  AL: IanaTimeZones.CHICAGO,
  AR: IanaTimeZones.CHICAGO,
  IA: IanaTimeZones.CHICAGO,
  IL: IanaTimeZones.CHICAGO,
  KS: IanaTimeZones.CHICAGO,
  KY: IanaTimeZones.CHICAGO,
  LA: IanaTimeZones.CHICAGO,
  MN: IanaTimeZones.CHICAGO,
  MO: IanaTimeZones.CHICAGO,
  MS: IanaTimeZones.CHICAGO,
  ND: IanaTimeZones.CHICAGO,
  NE: IanaTimeZones.CHICAGO,
  OK: IanaTimeZones.CHICAGO,
  SD: IanaTimeZones.CHICAGO,
  TN: IanaTimeZones.CHICAGO,
  TX: IanaTimeZones.CHICAGO,
  WI: IanaTimeZones.CHICAGO,

  // Mountain Time Zone
  AZ: IanaTimeZones.DENVER,
  CO: IanaTimeZones.DENVER,
  ID: IanaTimeZones.DENVER,
  MT: IanaTimeZones.DENVER,
  NM: IanaTimeZones.DENVER,
  UT: IanaTimeZones.DENVER,
  WY: IanaTimeZones.DENVER,

  // Pacific Time Zone
  CA: IanaTimeZones.LA,
  NV: IanaTimeZones.LA,
  OR: IanaTimeZones.LA,
  WA: IanaTimeZones.LA,

  // Alaska Time Zone
  AK: IanaTimeZones.ANCHORAGE,

  // Hawaii Time Zone
  HI: IanaTimeZones.HONOLULU
};
