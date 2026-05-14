import { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  name: 'qa',
  apiBaseUrl: 'https://qa-api.example.com/v1',
  appUrl: 'https://qa.example.com',
  enableDebugTools: true,
};
