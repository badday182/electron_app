import { useState, useMemo } from 'react'
import TaskCard from './components/taskCard/TaskCard.jsx'
import TaskForm from './components/TaskForm/TaskForm.jsx'
import TaskTabs from './components/TaskTabs/TaskTabs.jsx'
import { useTasks } from './hooks/useTasks.js'
import './assets/app.css'

function App() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const { tasks, loading, error, createTask, deleteTask, updateTask } = useTasks()

  const handleCreateTask = async (taskData) => {
    await createTask(taskData)
    setShowCreateForm(false)
  }

  const handleFormSubmit = async (taskIdOrData, taskData = null) => {
    if (taskData) {
      // Это редактирование - первый параметр это ID, второй - данные
      await updateTask(taskIdOrData, taskData)
      setEditingTask(null)
    } else {
      // Это создание - первый параметр это данные
      await createTask(taskIdOrData)
      setShowCreateForm(false)
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
      alert('Ошибка при удалении задачи: ' + err.message)
    }
  }

  const handleToggleComplete = async (taskId, currentCompleted) => {
    try {
      await updateTask(taskId, { completed: !currentCompleted })
    } catch (err) {
      alert('Ошибка при обновлении задачи: ' + err.message)
    }
  }

  const handleCancelCreate = () => {
    setShowCreateForm(false)
    setEditingTask(null)
  }

  // Фильтрация задач по активной вкладке
  const filteredTasks = useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return tasks.filter((task) => !task.completed)
      case 'completed':
        return tasks.filter((task) => task.completed)
      case 'all':
      default:
        return tasks
    }
  }, [tasks, activeTab])

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

  if (loading) {
    return <div>Загрузка задач...</div>
  }

  if (error) {
    return <div>Ошибка загрузки задач: {error}</div>
  }

  return (
    <div className="app-container">
      <div className="header-section">
        <button className="create-task-button" onClick={() => setShowCreateForm(true)}>
          Add New Task
        </button>
      </div>

      {showCreateForm && <TaskForm onSubmit={handleCreateTask} onCancel={handleCancelCreate} />}

      {editingTask && (
        <TaskForm
          onSubmit={handleFormSubmit}
          onCancel={handleCancelCreate}
          editTask={editingTask}
        />
      )}

      <TaskTabs activeTab={activeTab} onTabChange={handleTabChange} taskCounts={taskCounts} />

      <div className="tasks-container">
        {filteredTasks.length === 0 ? (
          <div className="no-tasks">
            {activeTab === 'all' && 'No tasks available'}
            {activeTab === 'pending' && 'No pending tasks'}
            {activeTab === 'completed' && 'No completed tasks'}
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
  )
}

export default App
