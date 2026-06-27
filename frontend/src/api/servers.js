import client from './client';

export const getServers   = ()         => client.get('/api/servers').then((r) => r.data);
export const createServer = (data)     => client.post('/api/servers', data).then((r) => r.data);
export const updateServer = (id, data) => client.put(`/api/servers/${id}`, data).then((r) => r.data);
export const deleteServer = (id)       => client.delete(`/api/servers/${id}`);
