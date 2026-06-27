import client from './client';

export const getCatalog      = () => client.get('/api/execution/catalog').then((r) => r.data);
export const getJobs         = (params = {}) => client.get('/api/execution/jobs', { params }).then((r) => r.data);
export const getJob          = (id) => client.get(`/api/execution/jobs/${id}`).then((r) => r.data);
export const installSoftware = (serverId, softwareKey) =>
  client.post('/api/execution/install', { serverId, softwareKey }).then((r) => r.data);
