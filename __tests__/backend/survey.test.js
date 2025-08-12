const request = require('supertest')
const { execSync } = require('child_process')
const app = require('../../server')

beforeEach(() => {
  execSync('npm run -s db:test:reset', { stdio: 'inherit' })
})

test('first survey inserts row and returns 200', async () => {
  const res = await request(app).post('/survey').send({
    user_id: 1,
    latitude: 1.2966,
    longitude: 103.7764,
    occupancy_level: 'Moderate (>25%)'
  })
  expect([200, 201]).toContain(res.status)
})

test('second survey within 30min returns 429 (cooldown)', async () => {
  await request(app).post('/survey').send({
    user_id: 1,
    latitude: 1.2966,
    longitude: 103.7764,
    occupancy_level: 'Crowded (>50%)'
  })
  const res2 = await request(app).post('/survey').send({
    user_id: 1,
    latitude: 1.2966,
    longitude: 103.7764,
    occupancy_level: 'Sparse (>0%)'
  })
  expect(res2.status).toBe(429)
})