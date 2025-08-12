const request = require('supertest')
const { execSync } = require('child_process')
const app = require('../../server')

beforeEach(() => {
  execSync('npm run -s db:test:reset', { stdio: 'inherit' })
})

test('returns occupancy level based on recent surveys', async () => {
  await request(app).post('/survey').send({
    user_id: 1,
    latitude: 1.3000,
    longitude: 103.8000,
    occupancy_level: 'Sparse (>0%)'
  })
  const res = await request(app)
    .get('/occupancy')
    .query({ lat: 1.3000, lon: 103.8000 })
  expect(res.status).toBe(200)
  expect(res.body).toHaveProperty('level')
})