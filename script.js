/**
 * Kodlama Ajandam - Mekanik / Endüstriyel Yapılacaklar Listesi Mantığı
 */

document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const addBtn = document.getElementById('add-btn');
    const taskList = document.getElementById('task-list');
    const counterDisplay = document.getElementById('counter-display');
    const emptyState = document.getElementById('empty-state');

    // Yerel hafızadan (localStorage) mevcut görevleri yükleme
    let tasks = JSON.parse(localStorage.getItem('kodlama_ajandam_tasks')) || [];
    let editingTaskId = null; // Düzenleme modundaki görevin ID'si

    // Görevleri kaydetme ve arayüzü güncelleme fonksiyonu
    function saveAndRender() {
        localStorage.setItem('kodlama_ajandam_tasks', JSON.stringify(tasks));
        renderTasks();
    }

    // Görev listesini DOM'a çizme
    function renderTasks() {
        taskList.innerHTML = '';

        if (tasks.length === 0) {
            emptyState.classList.remove('hidden');
            counterDisplay.textContent = '[ 0 MADDELER ]';
            return;
        }

        emptyState.classList.add('hidden');
        counterDisplay.textContent = `[ ${tasks.length} ${tasks.length === 1 ? 'MADDE' : 'MADDELER'} ]`;

        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.setAttribute('data-id', task.id);

            // Sıra numarası (örn: 01, 02...)
            const indexStr = String(index + 1).padStart(2, '0');
            const isEditing = (task.id === editingTaskId);

            if (isEditing) {
                // Düzenleme Modu
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
                        <button class="task-delete-btn" type="button" aria-label="Görevi sil">[DEL]</button>
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
                        <button class="task-delete-btn" type="button" aria-label="Görevi sil">[DEL]</button>
                    </div>
                `;
            }

            // Onay Kutusu (Checkbox) Değişimi
            const checkbox = li.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => {
                task.completed = checkbox.checked;
                saveAndRender();
            });

            // Düzenle / Kaydet Butonu
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
                    editingTaskId = task.id;
                    renderTasks();
                    const currentInput = taskList.querySelector(`.task-item[data-id="${task.id}"] .task-edit-input`);
                    if (currentInput) {
                        currentInput.focus();
                        currentInput.select();
                    }
                }
            });

            // Düzenleme kutusunda Enter ve Escape tuşları
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

            // Silme işlemi
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

    // Yeni görev ekleme
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

    // İlk yükleme
    renderTasks();
});
