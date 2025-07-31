import { useState, useMemo } from 'react'
import TaskCard from './components/taskCard/TaskCard.jsx'
import TaskForm from './components/TaskForm/TaskForm.jsx'
import TaskTabs from './components/TaskTabs/TaskTabs.jsx'
import Modal from './components/Modal/Modal.jsx'
import SyncStatus from './components/SyncStatus/SyncStatus.jsx'
import { useTasks } from './hooks/useTasks.js'
import './assets/app.css'

function App() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const {
    tasks,
    loading,
    error,
    syncing,
    syncError,
    lastSyncTime,
    createTask,
    deleteTask,
    updateTask,
    refreshTasks
  } = useTasks()

  const handleCreateTask = async (taskData) => {
    await createTask(taskData)
    setShowCreateForm(false)
  }

  const handleFormSubmit = async (taskIdOrData, taskData = null) => {
    try {
      if (taskData) {
        // Это редактирование - первый параметр это ID, второй - данные
        await updateTask(taskIdOrData, taskData)
        setEditingTask(null)
      } else {
        // Это создание - первый параметр это данные
        await createTask(taskIdOrData)
        setShowCreateForm(false)
      }
    } catch (err) {
      if (taskData && (err.message.includes('404') || err.message.includes('not found'))) {
        alert('Задача была удалена на сервере. Закрываем форму редактирования.')
        setEditingTask(null)
      } else {
        alert('Ошибка при сохранении задачи: ' + err.message)
      }
    }
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setShowCreateForm(false) // Закрываем форму создания если она открыта
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId)
    } catch (err) {
      if (err.message.includes('404') || err.message.includes('not found')) {
        // Задача уже была удалена на сервере, просто убираем её из локального состояния
        console.log('Task was already deleted on server, removing from local state')
      } else {
        alert('Ошибка при удалении задачи: ' + err.message)
      }
    }
  }

  const handleToggleComplete = async (taskId, currentCompleted) => {
    try {
      await updateTask(taskId, { completed: !currentCompleted })
    } catch (err) {
      if (err.message.includes('404') || err.message.includes('not found')) {
        alert('Задача была удалена или изменена на сервере. Данные обновляются...')
      } else {
        alert('Ошибка при обновлении задачи: ' + err.message)
      }
    }
  }

  const handleCancelCreate = () => {
    setShowCreateForm(false)
    setEditingTask(null)
  }

  // Фильтрация задач по активной вкладке и поисковому запросу
  const filteredTasks = useMemo(() => {
    let filtered = tasks

    // Фильтрация по вкладке
    switch (activeTab) {
      case 'pending':
        filtered = tasks.filter((task) => !task.completed)
        break
      case 'completed':
        filtered = tasks.filter((task) => task.completed)
        break
      case 'all':
      default:
        filtered = tasks
        break
    }

    // Фильтрация по поисковому запросу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((task) => {
        const title = (task.title || '').toLowerCase()
        const description = (task.description || '').toLowerCase()
        return title.includes(query) || description.includes(query)
      })
    }

    return filtered
  }, [tasks, activeTab, searchQuery])

  // Подсчет задач для каждой вкладки
  const taskCounts = useMemo(() => {
    const pending = tasks.filter((task) => !task.completed).length
    const completed = tasks.filter((task) => task.completed).length
    return {
      all: tasks.length,
      pending,
      completed
    }
  }, [tasks])

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
  }

  const handleSearchChange = (query) => {
    setSearchQuery(query)
  }

  if (loading) {
    return <div>Загрузка задач...</div>
  }

  if (error) {
    return <div>Ошибка загрузки задач: {error}</div>
  }

  return (
    <>
      <div className={`app-container ${showCreateForm || editingTask ? 'modal-open' : ''}`}>
        <div className="header-section">
          <button className="create-task-button" onClick={() => setShowCreateForm(true)}>
            Add New Task
          </button>
          <div className="sync-controls">
            <SyncStatus syncing={syncing} error={syncError} lastSyncTime={lastSyncTime} />
            <button className="refresh-button" onClick={refreshTasks} disabled={syncing}>
              Refresh
            </button>
          </div>
        </div>

        <TaskTabs activeTab={activeTab} onTabChange={handleTabChange} taskCounts={taskCounts} />

        <div className="search-section">
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks by title or description..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="tasks-container">
          {filteredTasks.length === 0 ? (
            <div className="no-tasks">
              {searchQuery.trim() ? (
                `No tasks found for "${searchQuery}"`
              ) : (
                <>
                  {activeTab === 'all' && 'No tasks available'}
                  {activeTab === 'pending' && 'No pending tasks'}
                  {activeTab === 'completed' && 'No completed tasks'}
                </>
              )}
            </div>
          ) : (
            filteredTasks.map((task, index) => (
              <TaskCard
                key={task.id || index}
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onToggleComplete={handleToggleComplete}
              />
            ))
          )}
        </div>
      </div>

      <Modal isOpen={showCreateForm} onClose={handleCancelCreate} title="Add New Task">
        <TaskForm onSubmit={handleCreateTask} onCancel={handleCancelCreate} />
      </Modal>

      <Modal isOpen={!!editingTask} onClose={handleCancelCreate} title="Edit Task">
        {editingTask && (
          <TaskForm
            onSubmit={handleFormSubmit}
            onCancel={handleCancelCreate}
            editTask={editingTask}
          />
        )}
      </Modal>
    </>
  )
}

export default App
