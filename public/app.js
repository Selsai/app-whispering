const whispersGrid = document.getElementById('whispers')
const addWhisperBtn = document.getElementById('addWhisper')
const toast = document.getElementById('toast')

// ===== TOAST =====
let toastTimer
const showToast = (msg, type = 'success') => {
  clearTimeout(toastTimer)
  toast.textContent = msg
  toast.className = `toast ${type} show`
  toastTimer = setTimeout(() => { toast.className = 'toast' }, 3000)
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

// ===== LOAD WHISPERS =====
const loadWhispers = async () => {
  const response = await fetch('/api/v1/whisper')
  const whispers = await response.json()
  whispersGrid.innerHTML = ''

  // Mettre à jour le compteur hero
  const countEl = document.getElementById('whisperCount')
  if (countEl) countEl.textContent = whispers.length

  if (whispers.length === 0) {
    whispersGrid.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🌸</span>
        <p>No whispers yet. Be the first to share!</p>
      </div>
    `
    return
  }

  whispers.forEach((whisper, i) => {
    const card = document.createElement('div')
    card.className = 'whisper-card'
    card.style.animationDelay = `${i * 0.07}s`
    card.innerHTML = `
      <div class="whisper-num">No. ${String(whisper.id).padStart(2, '0')}</div>
      <p class="whisper-text">${whisper.message}</p>
      <div class="whisper-actions">
        <button class="btn-edit" onclick="openEditModal(${whisper.id}, \`${whisper.message.replace(/`/g, "'")}\`)">
          ✏️ Edit
        </button>
        <button class="btn-delete" onclick="openDeleteModal(${whisper.id}, \`${whisper.message.replace(/`/g, "'")}\`)">
          ✕ Delete
        </button>
      </div>
    `
    whispersGrid.appendChild(card)
  })
}

// ===== INIT =====
addWhisperBtn.addEventListener('click', () => openEditModal())
loadWhispers()