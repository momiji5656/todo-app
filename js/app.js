document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const todoInput = document.getElementById('todo-input');
    const addButton = document.getElementById('add-button');
    const todoList = document.getElementById('todo-list');
    const tasksLeft = document.getElementById('tasks-left');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sortSelect = document.getElementById('sort-select');
    const searchInput = document.getElementById('search-input');
    const themeToggle = document.getElementById('theme-toggle');
    const editModal = document.getElementById('edit-modal');
    const closeButton = document.querySelector('.close-button');
    const editTodoText = document.getElementById('edit-todo-text');
    const editPriority = document.getElementById('edit-priority');
    const editDeadline = document.getElementById('edit-deadline');
    const editCategory = document.getElementById('edit-category');
    const editNotes = document.getElementById('edit-notes');
    const saveEditBtn = document.getElementById('save-edit');
    const categoriesList = document.getElementById('categories');

    // アプリの状態
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    let currentFilter = 'all';
    let currentSort = 'created';
    let currentEditId = null;
    let categories = new Set();

    // テーマの初期化
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    // Todoの初期表示
    renderTodos();
    updateTasksLeft();
    updateCategories();

    // イベントリスナーの設定
    addButton.addEventListener('click', addTodo);
    todoInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') addTodo();
    });
    clearCompletedBtn.addEventListener('click', clearCompleted);
    searchInput.addEventListener('input', renderTodos);
    themeToggle.addEventListener('click', toggleTheme);
    closeButton.addEventListener('click', closeModal);
    saveEditBtn.addEventListener('click', saveEdit);
    sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        renderTodos();
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTodos();
        });
    });

    // Todo追加関数
    function addTodo() {
        const todoText = todoInput.value.trim();
        if (todoText) {
            const newTodo = {
                id: Date.now(),
                text: todoText,
                completed: false,
                created: new Date(),
                priority: 'medium',
                deadline: '',
                category: '',
                notes: '',
                showDetails: false
            };
            
            todos.push(newTodo);
            saveTodos();
            todoInput.value = '';
            renderTodos();
            updateTasksLeft();
        }
    }

    // Todoのレンダリング
    function renderTodos() {
        const searchText = searchInput.value.toLowerCase();
        let filteredTodos = todos.filter(todo => {
            // 検索フィルター
            if (!todo.text.toLowerCase().includes(searchText)) return false;
            
            // カテゴリフィルター
            if (currentFilter === 'active' && todo.completed) return false;
            if (currentFilter === 'completed' && !todo.completed) return false;
            
            return true;
        });
        
        // 並べ替え
        filteredTodos.sort((a, b) => {
            if (currentSort === 'created') {
                return new Date(a.created) - new Date(b.created);
            } else if (currentSort === 'deadline') {
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.deadline) - new Date(b.deadline);
            } else if (currentSort === 'priority') {
                const priorityValues = { high: 3, medium: 2, low: 1 };
                return priorityValues[b.priority] - priorityValues[a.priority];
            }
        });
        
        todoList.innerHTML = '';
        
        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.dataset.id = todo.id;
            li.draggable = true;
            
            const priorityIndicator = document.createElement('span');
            priorityIndicator.className = `priority-indicator priority-${todo.priority}`;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'todo-checkbox';
            checkbox.checked = todo.completed;
            checkbox.addEventListener('change', () => toggleComplete(todo.id));
            
            const textSpan = document.createElement('span');
            textSpan.className = 'todo-text';
            textSpan.textContent = todo.text;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'todo-actions';
            
            const detailsBtn = document.createElement('button');
            detailsBtn.innerHTML = todo.showDetails ? '<i class="fas fa-chevron-up"></i>' : '<i class="fas fa-chevron-down"></i>';
            detailsBtn.addEventListener('click', () => toggleDetails(todo.id));
            
            const editBtn = document.createElement('button');
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.addEventListener('click', () => openEditModal(todo.id));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
            
            actionsDiv.appendChild(detailsBtn);
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
            
            li.appendChild(priorityIndicator);
            li.appendChild(checkbox);
            li.appendChild(textSpan);
            li.appendChild(actionsDiv);
            
            // 詳細情報
            if (todo.showDetails) {
                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'todo-details';
                
                if (todo.deadline) {
                    const deadlineDate = new Date(todo.deadline);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    const deadlineDiv = document.createElement('div');
                    deadlineDiv.textContent = `期限: ${formatDate(todo.deadline)}`;
                    
                    if (deadlineDate < today) {
                        deadlineDiv.style.color = 'var(--high-priority)';
                    }
                    
                    detailsDiv.appendChild(deadlineDiv);
                }
                
                if (todo.category) {
                    const categoryDiv = document.createElement('div');
                    categoryDiv.textContent = `カテゴリ: ${todo.category}`;
                    detailsDiv.appendChild(categoryDiv);
                }
                
                if (todo.notes) {
                    const notesDiv = document.createElement('div');
                    notesDiv.textContent = `メモ: ${todo.notes}`;
                    detailsDiv.appendChild(notesDiv);
                }
                
                const createdDiv = document.createElement('div');
                createdDiv.textContent = `作成日: ${formatDate(todo.created)}`;
                detailsDiv.appendChild(createdDiv);
                
                li.appendChild(detailsDiv);
            }
            
            // ドラッグ＆ドロップのイベント
            li.addEventListener('dragstart', dragStart);
            li.addEventListener('dragover', dragOver);
            li.addEventListener('drop', drop);
            li.addEventListener('dragenter', dragEnter);
            li.addEventListener('dragleave', dragLeave);
            
            todoList.appendChild(li);
        });
    }

    // 完了状態の切り替え
    function toggleComplete(id) {
        todos = todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, completed: !todo.completed };
            }
            return todo;
        });
        
        saveTodos();
        renderTodos();
        updateTasksLeft();
    }

    // 詳細表示の切り替え
    function toggleDetails(id) {
        todos = todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, showDetails: !todo.showDetails };
            }
            return todo;
        });
        
        renderTodos();
    }

    // Todoの削除
    function deleteTodo(id) {
        if (confirm('このタスクを削除してもよろしいですか？')) {
            todos = todos.filter(todo => todo.id !== id);
            saveTodos();
            renderTodos();
            updateTasksLeft();
            updateCategories();
        }
    }

    // 完了済みの削除
    function clearCompleted() {
        if (todos.some(todo => todo.completed)) {
            if (confirm('完了したすべてのタスクを削除してもよろしいですか？')) {
                todos = todos.filter(todo => !todo.completed);
                saveTodos();
                renderTodos();
                updateTasksLeft();
                updateCategories();
            }
        }
    }

    // 残りのタスク数の更新
    function updateTasksLeft() {
        const activeCount = todos.filter(todo => !todo.completed).length;
        tasksLeft.textContent = `${activeCount} 個のタスクが残っています`;
    }

    // カテゴリの更新
    function updateCategories() {
        categories = new Set();
        todos.forEach(todo => {
            if (todo.category) {
                categories.add(todo.category);
            }
        });
        
        categoriesList.innerHTML = '';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            categoriesList.appendChild(option);
        });
    }

    // 編集モーダルを開く
    function openEditModal(id) {
        const todo = todos.find(t => t.id === id);
        if (todo) {
            currentEditId = id;
            editTodoText.value = todo.text;
            editPriority.value = todo.priority;
            editDeadline.value = todo.deadline;
            editCategory.value = todo.category;
            editNotes.value = todo.notes;
            editModal.style.display = 'flex';
        }
    }

    // モーダルを閉じる
    function closeModal() {
        editModal.style.display = 'none';
        currentEditId = null;
    }

    // 編集を保存
    function saveEdit() {
        if (currentEditId) {
            todos = todos.map(todo => {
                if (todo.id === currentEditId) {
                    return {
                        ...todo,
                        text: editTodoText.value,
                        priority: editPriority.value,
                        deadline: editDeadline.value,
                        category: editCategory.value,
                        notes: editNotes.value
                    };
                }
                return todo;
            });
            
            saveTodos();
            updateCategories();
            renderTodos();
            closeModal();
        }
    }

    // テーマの切り替え
    function toggleTheme() {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    // ローカルストレージに保存
    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    // 日付のフォーマット
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // ドラッグ＆ドロップの実装
    let draggedItem = null;

    function dragStart(e) {
        draggedItem = this;
        setTimeout(() => this.classList.add('dragging'), 0);
    }

    function dragOver(e) {
        e.preventDefault();
    }

    function dragEnter(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    }

    function dragLeave() {
        this.classList.remove('drag-over');
    }

    function drop() {
        this.classList.remove('drag-over');
        
        if (draggedItem !== this) {
            const allItems = Array.from(todoList.querySelectorAll('.todo-item'));
            const fromIndex = allItems.indexOf(draggedItem);
            const toIndex = allItems.indexOf(this);
            
            // ドラッグ＆ドロップにあわせてTodo配列も並び替え
            const draggedTodoId = parseInt(draggedItem.dataset.id);
            const targetTodoId = parseInt(this.dataset.id);
            
            // 元のindexを取得
            const originalTodos = [...todos];
            const draggedIndex = originalTodos.findIndex(todo => todo.id === draggedTodoId);
            const targetIndex = originalTodos.findIndex(todo => todo.id === targetTodoId);
            
            // 配列を並び替え
            const [removed] = originalTodos.splice(draggedIndex, 1);
            originalTodos.splice(targetIndex, 0, removed);
            
            todos = originalTodos;
            saveTodos();
            renderTodos();
        }
        
        draggedItem.classList.remove('dragging');
        draggedItem = null;
    }
});