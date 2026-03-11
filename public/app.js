const whispersGrid = document.getElementById('whispers')
const addWhisperBtn = document.getElementById('addWhisper')
const toast = document.getElementById('toast')

// ===== DARK MODE =====
const darkToggle = document.getElementById('darkToggle')
const root = document.documentElement

const applyTheme = (theme) => {
  root.setAttribute('data-theme', theme)
  darkToggle.textContent = theme === 'dark' ? '☀️' : '🌙'
  localStorage.setItem('theme', theme)
}

const savedTheme = localStorage.getItem('theme') || 'light'
applyTheme(savedTheme)

darkToggle.addEventListener('click', () => {
  const current = root.getAttribute('data-theme')
  applyTheme(current === 'dark' ? 'light' : 'dark')
})

// ===== CONFETTI =====
const canvas = document.getElementById('confettiCanvas')
const ctx = canvas.getContext('2d')
let confettiParticles = []
let confettiRunning = false

const CONFETTI_COLORS = ['#e8a0b0', '#9db89c', '#f5c6d4', '#c4a882', '#fceef3', '#d4708a']

const resizeCanvas = () => {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

resizeCanvas()
window.addEventListener('resize', resizeCanvas)

const createParticle = () => ({
  x: Math.random() * canvas.width,
  y: -10,
  w: Math.random() * 10 + 5,
  h: Math.random() * 5 + 3,
  color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  rotation: Math.random() * 360,
  speed: Math.random() * 3 + 2,
  rotationSpeed: Math.random() * 4 - 2,
  opacity: 1,
  wobble: Math.random() * Math.PI * 2,
  wobbleSpeed: Math.random() * 0.05 + 0.02
})

const launchConfetti = () => {
  confettiParticles = Array.from({ length: 80 }, createParticle)
  confettiRunning = true
  animateConfetti()
}

const animateConfetti = () => {
  if (!confettiRunning) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  confettiParticles = confettiParticles.filter(p => p.opacity > 0)

  confettiParticles.forEach(p => {
    p.y += p.speed
    p.rotation += p.rotationSpeed
    p.wobble += p.wobbleSpeed
    p.x += Math.sin(p.wobble) * 1.5
    if (p.y > canvas.height * 0.7) p.opacity -= 0.025

    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate((p.rotation * Math.PI) / 180)
    ctx.globalAlpha = p.opacity
    ctx.fillStyle = p.color
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
    ctx.restore()
  })

  if (confettiParticles.length > 0) {
    requestAnimationFrame(animateConfetti)
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    confettiRunning = false
  }
}

// ===== TOAST =====
let toastTimer
const showToast = (msg, type = 'success') => {
  clearTimeout(toastTimer)
  toast.textContent = msg
  toast.className = `toast ${type} show`
  toastTimer = setTimeout(() => { toast.className = 'toast' }, 3000)
}

// ===== SKELETON =====
const showSkeleton = () => {
  whispersGrid.innerHTML = Array.from({ length: 3 }, () => `
    <div class="whisper-card skeleton-card">
      <div class="skeleton skeleton-num"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text short"></div>
      <div class="skeleton skeleton-actions"></div>
    </div>
  `).join('')
}

// ===== SEARCH =====
const searchInput = document.getElementById('searchInput')
const searchClear = document.getElementById('searchClear')
const searchResultsCount = document.getElementById('searchResultsCount')
let allWhispers = []

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase()
  searchClear.style.opacity = query ? '1' : '0'
  filterWhispers(query)
})

searchClear.addEventListener('click', () => {
  searchInput.value = ''
  searchClear.style.opacity = '0'
  filterWhispers('')
  searchInput.focus()
})

const filterWhispers = (query) => {
  const filtered = query
    ? allWhispers.filter(w => w.message.toLowerCase().includes(query))
    : allWhispers

  searchResultsCount.textContent = query
    ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${query}"`
    : ''

  renderWhispers(filtered, query)
}

const highlightText = (text, query) => {
  if (!query) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="highlight">$1</mark>')
}

// ===== RENDER WHISPERS =====
const renderWhispers = (whispers, query = '') => {
  whispersGrid.innerHTML = ''

  if (whispers.length === 0) {
    whispersGrid.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">${query ? '🔍' : '🌸'}</span>
        <p>${query ? `No whispers found for "${query}"` : 'No whispers yet. Be the first to share!'}</p>
      </div>
    `
    return
  }

  whispers.forEach((whisper, i) => {
    const card = document.createElement('div')
    card.className = 'whisper-card'
    card.style.animationDelay = `${i * 0.07}s`
    const highlighted = highlightText(whisper.message, query)
    const liked = isLiked(whisper.id)
    card.innerHTML = `
      <div class="whisper-num">No. ${String(whisper.id).padStart(2, '0')}</div>
      <p class="whisper-text">${highlighted}</p>
      <div class="whisper-footer">
        <button class="btn-like ${liked ? 'liked' : ''}" onclick="handleLike(${whisper.id}, this)">
          ${liked ? '❤️' : '🤍'} <span class="like-count">${whisper.likes || 0}</span>
        </button>
        <div class="whisper-actions">
          <button class="btn-edit" onclick="openEditModal(${whisper.id}, \`${whisper.message.replace(/`/g, "'")}\`)">
            ✏️ Edit
          </button>
          <button class="btn-delete" onclick="openDeleteModal(${whisper.id}, \`${whisper.message.replace(/`/g, "'")}\`)">
            ✕ Delete
          </button>
        </div>
      </div>
    `
    whispersGrid.appendChild(card)
  })
}

// ===== LIKES =====
const getLikedSet = () => new Set(JSON.parse(localStorage.getItem('liked') || '[]'))

const isLiked = (id) => getLikedSet().has(id)

const toggleLikedStorage = (id) => {
  const liked = getLikedSet()
  if (liked.has(id)) { liked.delete(id) } else { liked.add(id) }
  localStorage.setItem('liked', JSON.stringify([...liked]))
}

const handleLike = async (id, btn) => {
  const alreadyLiked = isLiked(id)
  const action = alreadyLiked ? 'unlike' : 'like'

  const res = await fetch(`/api/v1/whisper/${id}/like`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  })
  if (!res.ok) return

  const whisper = await res.json()
  toggleLikedStorage(id)

  const nowLiked = isLiked(id)
  btn.classList.toggle('liked', nowLiked)
  btn.innerHTML = `${nowLiked ? '❤️' : '🤍'} <span class="like-count">${whisper.likes}</span>`
  btn.style.transform = 'scale(1.3)'
  setTimeout(() => { btn.style.transform = '' }, 300)
  updateStats()
}

// ===== STATS =====
const updateStats = async () => {
  const countEl = document.getElementById('whisperCount')
  const likesEl = document.getElementById('totalLikes')
  if (!countEl && !likesEl) return
  const whispers = await fetch('/api/v1/whisper').then(r => r.json())
  if (countEl) countEl.textContent = whispers.length
  if (likesEl) likesEl.textContent = whispers.reduce((acc, w) => acc + (w.likes || 0), 0)
}

// ===== LOAD WHISPERS =====
const loadWhispers = async () => {
  showSkeleton()
  const response = await fetch('/api/v1/whisper')
  allWhispers = await response.json()

  const countEl = document.getElementById('whisperCount')
  const likesEl = document.getElementById('totalLikes')
  if (countEl) countEl.textContent = allWhispers.length
  if (likesEl) likesEl.textContent = allWhispers.reduce((acc, w) => acc + (w.likes || 0), 0)

  const query = searchInput ? searchInput.value.trim().toLowerCase() : ''
  filterWhispers(query)
}

// ===== MODAL EDIT / ADD =====
const modalEdit = document.getElementById('modalEdit')
const modalEditTitle = document.getElementById('modalEditTitle')
const modalEditSub = document.getElementById('modalEditSub')
const modalEditIcon = document.getElementById('modalEditIcon')
const modalEditInput = document.getElementById('modalEditInput')
const modalEditConfirm = document.getElementById('modalEditConfirm')
const modalEditCancel = document.getElementById('modalEditCancel')
const modalEditClose = document.getElementById('modalEditClose')
const charCount = document.getElementById('charCount')

let editingId = null

const openEditModal = (id = null, currentMessage = '') => {
  editingId = id
  if (id) {
    modalEditTitle.textContent = 'Edit whisper'
    modalEditSub.textContent = 'Refine your thoughts ✨'
    modalEditIcon.textContent = '✏️'
    modalEditConfirm.textContent = 'Save changes ✦'
  } else {
    modalEditTitle.textContent = 'New whisper'
    modalEditSub.textContent = "What's on your mind today?"
    modalEditIcon.textContent = '🌸'
    modalEditConfirm.textContent = 'Publish ✦'
  }
  modalEditInput.value = currentMessage
  charCount.textContent = currentMessage.length
  charCount.parentElement.className = currentMessage.length > 240
    ? 'modal-char-count warn' : 'modal-char-count'
  modalEdit.classList.add('active')
  setTimeout(() => modalEditInput.focus(), 300)
}

const closeEditModal = () => {
  modalEdit.classList.remove('active')
  editingId = null
}

modalEditInput.addEventListener('input', () => {
  const len = modalEditInput.value.length
  charCount.textContent = len
  charCount.parentElement.className = len > 240
    ? 'modal-char-count warn' : 'modal-char-count'
})

modalEditConfirm.addEventListener('click', async () => {
  const message = modalEditInput.value.trim()
  if (!message) {
    modalEditInput.style.borderColor = 'var(--rose-deep)'
    setTimeout(() => { modalEditInput.style.borderColor = '' }, 1500)
    return
  }
  if (editingId) {
    await fetch(`/api/v1/whisper/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    })
    showToast('Whisper updated ✨')
  } else {
    await fetch('/api/v1/whisper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    })
    showToast('Whisper published 🌸')
    launchConfetti()
  }
  closeEditModal()
  loadWhispers()
})

modalEditCancel.addEventListener('click', closeEditModal)
modalEditClose.addEventListener('click', closeEditModal)
modalEdit.addEventListener('click', e => {
  if (e.target === modalEdit) closeEditModal()
})

// ===== MODAL DELETE =====
const modalDelete = document.getElementById('modalDelete')
const deletePreview = document.getElementById('deletePreview')
const modalDeleteConfirm = document.getElementById('modalDeleteConfirm')
const modalDeleteCancel = document.getElementById('modalDeleteCancel')
const modalDeleteClose = document.getElementById('modalDeleteClose')

let deletingId = null

const openDeleteModal = (id, message) => {
  deletingId = id
  deletePreview.textContent = `"${message}"`
  modalDelete.classList.add('active')
}

const closeDeleteModal = () => {
  modalDelete.classList.remove('active')
  deletingId = null
}

modalDeleteConfirm.addEventListener('click', async () => {
  await fetch(`/api/v1/whisper/${deletingId}`, { method: 'DELETE' })
  closeDeleteModal()
  showToast('Whisper deleted', 'error')
  loadWhispers()
})

modalDeleteCancel.addEventListener('click', closeDeleteModal)
modalDeleteClose.addEventListener('click', closeDeleteModal)
modalDelete.addEventListener('click', e => {
  if (e.target === modalDelete) closeDeleteModal()
})

// ===== KEYBOARD =====
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeEditModal()
    closeDeleteModal()
  }
  if (e.key === 'Enter' && e.metaKey && modalEdit.classList.contains('active')) {
    modalEditConfirm.click()
  }
})

// ===== INIT =====
addWhisperBtn.addEventListener('click', () => openEditModal())
loadWhispers()