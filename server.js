import express from 'express'
import bodyParser from 'body-parser'
import { getAll, getById, create, updateById, deleteById, likeById } from './store.js'

const app = express()

app.use(bodyParser.json())
app.use(express.static('public'))
app.set('view engine', 'ejs')

// About
app.get('/about', async (req, res) => {
  const whispers = await getAll()
  res.render('about', { whispers })
})

// GET ALL
app.get('/api/v1/whisper', async (req, res) => {
  const whispers = await getAll()
  res.json(whispers)
})

// GET BY ID
app.get('/api/v1/whisper/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  const whisper = await getById(id)
  if (!whisper) {
    res.sendStatus(404)
  } else {
    res.json(whisper)
  }
})

// CREATE
app.post('/api/v1/whisper', async (req, res) => {
  const { message } = req.body
  if (!message) {
    res.sendStatus(400)
  } else {
    const whisper = await create(message)
    res.status(201).json(whisper)
  }
})

// UPDATE
app.put('/api/v1/whisper/:id', async (req, res) => {
  const { message } = req.body
  const id = parseInt(req.params.id)
  if (!message) {
    res.sendStatus(400)
  } else {
    const whisper = await getById(id)
    if (!whisper) {
      res.sendStatus(404)
    } else {
      await updateById(id, message)
      res.sendStatus(200)
    }
  }
})

// DELETE
app.delete('/api/v1/whisper/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  const whisper = await getById(id)
  if (!whisper) {
    res.sendStatus(404)
    return
  }
  await deleteById(id)
  res.sendStatus(200)
})

// LIKE / UNLIKE toggle
app.patch('/api/v1/whisper/:id/like', async (req, res) => {
  const id = parseInt(req.params.id)
  const { action } = req.body // "like" ou "unlike"
  const data = await getAll()
  const whisper = data.find(w => w.id === id)
  if (!whisper) return res.sendStatus(404)

  const newLikes = action === 'unlike'
    ? Math.max(0, (whisper.likes || 0) - 1)
    : (whisper.likes || 0) + 1

  await updateById(id, whisper.message, newLikes)
  const updated = await getById(id)
  res.json(updated)
})

// 404 CUSTOM
app.use((req, res) => {
  res.status(404).render('404')
})

export { app }