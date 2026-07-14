import api from './client'

export const authApi = {
  register : (data) => api.post('/auth/register', data),
  login    : (data) => api.post('/auth/login', data),
  me       : ()     => api.get('/auth/me'),
}

export const exercisesApi = {
  list   : (params) => api.get('/exercises', { params }),
  create : (data)   => api.post('/exercises', data),
}

export const routinesApi = {
  list   : ()                     => api.get('/routines'),
  get    : (id)                   => api.get(`/routines/${id}`),
  create : (data)                 => api.post('/routines', data),
  update : (id, data)             => api.put(`/routines/${id}`, data),
  delete : (id)                   => api.delete(`/routines/${id}`),
  assign : (routineId, athleteId) => api.post(`/routines/${routineId}/assign`, { athlete_id: athleteId }),
}

export const sessionsApi = {
  list        : ()                 => api.get('/sessions'),
  get         : (id)               => api.get(`/sessions/${id}`),
  create      : (data)             => api.post('/sessions', data),
  logSet      : (sessionId, data)  => api.post(`/sessions/${sessionId}/sets`, data),
  deleteSet   : (sessionId, setId) => api.delete(`/sessions/${sessionId}/sets/${setId}`),
  complete    : (sessionId)        => api.patch(`/sessions/${sessionId}/complete`),
  delete      : (sessionId)        => api.delete(`/sessions/${sessionId}`),
}

export const usersApi = {
  allAthletes  : ()            => api.get('/athletes'),
  myAthletes   : ()            => api.get('/coach/athletes'),
  linkAthlete  : (athleteId)   => api.post(`/athletes/${athleteId}/link`),
  unlinkAthlete: (athleteId)   => api.delete(`/athletes/${athleteId}/link`),
  progress     : (athleteId)   => api.get(`/progress/${athleteId}`),
  personalBest : (exerciseId)  => api.get(`/personal-best/${exerciseId}`),
}