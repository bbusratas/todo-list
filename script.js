/**
 * Kodlama Ajandam - Mekanik / Endüstriyel Yapılacaklar Listesi Mantığı
 * localStorage Entegrasyonu ile Kalıcı Veri Saklama
 */

document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const addBtn = document.getElementById('add-btn');
    const taskList = document.getElementById('task-list');
    const counterDisplay = document.getElementById('counter-display');
    const emptyState = document.getElementById('empty-state');
    const clearAllBtn = document.getElementById('clear-all-btn');

    // localStorage Anahtarı
    const STORAGE_KEY = 'kodlama_ajandam_tasks';

    // 1. HAFIZADAN YÜKLEME: Sayfa açıldığında veya yenilendiğinde (F5) verileri geri yükler
    function loadTasks() {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            return savedData ? JSON.parse(savedData) : [];
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
            return [];
        }
    }

    // 2. HAFIZAYA KAYDETME: Değişiklikleri localStorage üzerine yazar
    function saveTasks(tasksToSave) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksToSave));
        } catch (error) {
            console.error('Veri kaydetme hatası:', error);
        }
    }

    // Uygulama Durumu
    let tasks = loadTasks();
    let editingTaskId = null; // Aktif düzenlenen görevin ID'si

    // Değişiklikleri kaydedip arayüzü güncelleyen ana fonksiyon
    function saveAndRender() {
        saveTasks(tasks);
        renderTasks();
    }

    // Görev listesini DOM'a çizme
    function renderTasks() {
        taskList.innerHTML = '';

        if (tasks.length === 0) {
            emptyState.classList.remove('hidden');
            counterDisplay.textContent = '[ 0 MADDELER ]';
            if (clearAllBtn) clearAllBtn.disabled = true;
            return;
        }

        emptyState.classList.add('hidden');
        counterDisplay.textContent = `[ ${tasks.length} ${tasks.length === 1 ? 'MADDE' : 'MADDELER'} ]`;
        if (clearAllBtn) clearAllBtn.disabled = false;

        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.setAttribute('data-id', task.id);

            // Sıra numarası (örn: [01], [02]...)
            const indexStr = String(index + 1).padStart(2, '0');
            const isEditing = (task.id === editingTaskId);

            if (isEditing) {
                // Düzenleme Modu (Metin Değiştirme)
                li.innerHTML = `
                    <div class="task-left">
                        <input 
                            type="checkbox" 
                            class="task-checkbox" 
                            ${task.completed ? 'checked' : ''} 
                            aria-label="Görevi tamamla"
                        >
                        <span class="task-index">[${indexStr}]</span>
                        <input 
                            type="text" 
                            class="task-edit-input" 
                            value="${escapeHtml(task.text)}" 
                            spellcheck="false" 
                            autocomplete="off"
                        >
                    </div>
                    <div class="task-actions">
                        <button class="task-edit-btn is-saving" type="button" aria-label="Değişikliği kaydet">KAYDET</button>
                        <button class="task-delete-btn" type="button" aria-label="Görevi sil">Sil</button>
                    </div>
                `;
            } else {
                // Normal Görüntüleme Modu
                li.innerHTML = `
                    <div class="task-left">
                        <input 
                            type="checkbox" 
                            class="task-checkbox" 
                            ${task.completed ? 'checked' : ''} 
                            aria-label="Görevi tamamla"
                        >
                        <span class="task-index">[${indexStr}]</span>
                        <span class="task-text">${escapeHtml(task.text)}</span>
                    </div>
                    <div class="task-actions">
                        <button class="task-edit-btn" type="button" aria-label="Görevi düzenle">Düzenle</button>
                        <button class="task-delete-btn" type="button" aria-label="Görevi sil">Sil</button>
                    </div>
                `;
            }

            // [İŞLEM 1] TAMAMLANDI OLARAK İŞARETLEME -> localStorage'a kaydeder
            const checkbox = li.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => {
                task.completed = checkbox.checked;
                saveAndRender();
            });

            // [İŞLEM 2] DÜZENLEME & KAYDETME -> localStorage'a kaydeder
            const editBtn = li.querySelector('.task-edit-btn');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (isEditing) {
                    const editInput = li.querySelector('.task-edit-input');
                    const updatedText = editInput ? editInput.value.trim() : '';
                    if (updatedText) {
                        task.text = updatedText;
                    }
                    editingTaskId = null;
                    saveAndRender();
                } else {
                    // Varsa önceki düzenlemeyi kaydet
                    commitActiveEdit();
                    editingTaskId = task.id;
                    renderTasks();
                    const currentInput = taskList.querySelector(`.task-item[data-id="${task.id}"] .task-edit-input`);
                    if (currentInput) {
                        currentInput.focus();
                        currentInput.select();
                    }
                }
            });

            // Düzenleme kutusunda Enter (Kaydet) ve Escape (İptal)
            if (isEditing) {
                const editInput = li.querySelector('.task-edit-input');
                editInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const updatedText = editInput.value.trim();
                        if (updatedText) {
                            task.text = updatedText;
                        }
                        editingTaskId = null;
                        saveAndRender();
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        editingTaskId = null;
                        renderTasks();
                    }
                });
            }

            // [İŞLEM 3] TEKİL SİLME -> localStorage'a kaydeder
            const deleteBtn = li.querySelector('.task-delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (editingTaskId === task.id) {
                    editingTaskId = null;
                }
                tasks = tasks.filter(t => t.id !== task.id);
                saveAndRender();
            });

            taskList.appendChild(li);
        });
    }

    // Açık olan düzenlemeyi kaydetme yardımcısı
    function commitActiveEdit() {
        if (editingTaskId === null) return;
        const activeInput = taskList.querySelector(`.task-item[data-id="${editingTaskId}"] .task-edit-input`);
        if (activeInput) {
            const val = activeInput.value.trim();
            const task = tasks.find(t => t.id === editingTaskId);
            if (task && val) {
                task.text = val;
                saveTasks(tasks);
            }
        }
    }

    // [İŞLEM 4] YENİ GÖREV EKLEME -> localStorage'a kaydeder
    function addTask() {
        const text = taskInput.value.trim();

        if (!text) {
            taskInput.focus();
            // Görsel uyarı efekti
            taskInput.parentElement.style.borderColor = 'var(--neon-crimson)';
            setTimeout(() => {
                taskInput.parentElement.style.borderColor = '';
            }, 600);
            return;
        }

        tasks.push({
            id: Date.now(),
            text: text,
            completed: false
        });

        taskInput.value = '';
        taskInput.focus();
        saveAndRender();
    }

    // [İŞLEM 5] TÜMÜNÜ SİLME -> localStorage'dan da tamamen temizler
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (tasks.length === 0) return;
            tasks = [];
            editingTaskId = null;
            saveAndRender();
        });
    }

    // Olay Dinleyicileri
    addBtn.addEventListener('click', addTask);

    taskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // XSS koruması için HTML karakter kaçırma
    function escapeHtml(string) {
        const div = document.createElement('div');
        div.textContent = string;
        return div.innerHTML;
    }

    // [BAŞLANGIÇ] Sayfa ilk açıldığında veya yenilendiğinde (F5) verileri ekrana yükle
    renderTasks();
});
