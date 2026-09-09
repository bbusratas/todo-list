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

            // Sıra numarası (örn: 01, 02...)
            const indexStr = String(index + 1).padStart(2, '0');

            li.innerHTML = `
        <div class="task-left">
          <button class="task-check-btn" type="button" aria-label="Görevi tamamla">
            <span class="check-indicator"></span>
          </button>
          <span class="task-index">[${indexStr}]</span>
          <span class="task-text">${escapeHtml(task.text)}</span>
        </div>
        <button class="task-delete-btn" type="button" aria-label="Görevi sil">[DEL]</button>
      `;

            // Tamamlama durumu değiştirme (checkbox veya satıra tıklama)
            const checkBtn = li.querySelector('.task-check-btn');
            checkBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                task.completed = !task.completed;
                saveAndRender();
            });

            // Silme işlemi
            const deleteBtn = li.querySelector('.task-delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                tasks.splice(index, 1);
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
