export type EnvironmentName =
  | 'local'
  | 'development'
  | 'dev'
  | 'qa'
  | 'uat'
  | 'staging'
  | 'production';

export interface Environment {
  production: boolean;
  name: EnvironmentName;
  apiBaseUrl: string;
  appUrl: string;
  enableDebugTools: boolean;
}
