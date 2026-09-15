import api from './api';

async function getAll() {
  const { data } = await api.get('/clubs/list');
  return Array.isArray(data) ? data : data.clubs ?? [];
}

const clubService = { getAll };

export default clubService;
export { getAll };
