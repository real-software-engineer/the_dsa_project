import { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  name: 'staging',
  apiBaseUrl: 'https://staging-api.example.com/v1',
  appUrl: 'https://staging.example.com',
  enableDebugTools: false,
};
