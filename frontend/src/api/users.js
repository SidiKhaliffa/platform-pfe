import client from './client';

export const getUsers   = ()     => client.get('/api/auth/users').then((r) => r.data);
export const createUser = (data) => client.post('/api/auth/users', data).then((r) => r.data);
