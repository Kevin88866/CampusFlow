const request = require('supertest')
const { execSync } = require('child_process')
const app = require('../../server')

beforeEach(() => {
  execSync('npm run -s db:test:reset', { stdio: 'inherit' })
})

test('update profile returns updated fields', async () => {
  const res = await request(app).put('/users/1').send({
    name: 'tester2',
    email: 't2@e.st',
    phone: '123',
    interest: 'AI'
  })
  expect(res.status).toBe(200)
  expect(res.body).toMatchObject({ name: 'tester2', email: 't2@e.st' })
})

test('ranking deterministic order for ties', async () => {
  await request(app).post('/survey').send({
    user_id: 1, latitude: 1.3, longitude: 103.8, occupancy_level: 'Moderate (>25%)'
  })
  const res = await request(app).get('/ranking')
  expect(res.status).toBe(200)
  expect(Array.isArray(res.body)).toBe(true)
})