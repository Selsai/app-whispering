import fs from 'node:fs/promises'
import path from 'node:path'

const filename = path.join(process.cwd(), 'db.json')

const saveChanges = data => fs.writeFile(filename, JSON.stringify(data))

const readData = async () => {
  const data = await fs.readFile(filename, 'utf-8')
  return JSON.parse(data)
}

const getAll = readData

const getById = async (id) => {
  const data = await readData()
  return data.find(item => item.id === id)
}

const create = async (message) => {
  const data = await readData()
  const newItem = { message, id: data.length + 1, likes: 0 }
  await saveChanges(data.concat([newItem]))
  return newItem
}

const updateById = async (id, message, likes = null) => {
  const data = await readData()
  const newData = data.map(current => {
    if (current.id === id) {
      return {
        ...current,
        message,
        likes: likes !== null ? likes : (current.likes || 0)
      }
    }
    return current
  })
  await saveChanges(newData)
}

const deleteById = async id => {
  const data = await readData()
  await saveChanges(data.filter(current => current.id !== id))
}

const likeById = async (id) => {
  const data = await readData()
  let found = false
  const newData = data.map(current => {
    if (current.id === id) {
      found = true
      const currentLikes = current.likes || 0
      return { ...current, likes: currentLikes }
    }
    return current
  })
  if (!found) return undefined
  await saveChanges(newData)
  return newData.find(item => item.id === id)
}

export { getAll, getById, create, updateById, deleteById, likeById }