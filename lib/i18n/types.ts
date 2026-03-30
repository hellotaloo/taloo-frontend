export type Locale = 'nl' | 'en';

export interface Dictionary {
  [key: string]: string | Dictionary;
}
