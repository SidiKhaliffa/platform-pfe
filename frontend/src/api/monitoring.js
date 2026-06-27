import client from './client';

export const getMonitoringStatus = () =>
  client.get('/api/monitoring/status').then((r) => r.data);

export const getHistory = (serverId, params = {}) =>
  client.get(`/api/monitoring/history/${serverId}`, { params }).then((r) => r.data);

export const checkServer = (serverId) =>
  client.post(`/api/monitoring/check/${serverId}`).then((r) => r.data);

export const checkAll = () =>
  client.post('/api/monitoring/check').then((r) => r.data);
