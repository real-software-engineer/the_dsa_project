import { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  name: 'local',
  apiBaseUrl: 'http://localhost:3000/',
  appUrl: 'http://localhost:4200',
  enableDebugTools: true,
};
