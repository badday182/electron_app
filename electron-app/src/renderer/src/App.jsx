import { useState } from 'react'
import TaskCard from './components/taskCard/TaskCard.jsx'
import TaskForm from './components/TaskForm/TaskForm.jsx'
import { useTasks } from './hooks/useTasks.js'
import './assets/app.css'

function App() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const { tasks, loading, error, createTask } = useTasks()

  const handleCreateTask = async (taskData) => {
    await createTask(taskData)
    setShowCreateForm(false)
  }

  const handleCancelCreate = () => {
    setShowCreateForm(false)
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
          Создать новую задачу
        </button>
      </div>

      {showCreateForm && <TaskForm onSubmit={handleCreateTask} onCancel={handleCancelCreate} />}

      <div className="tasks-container">
        {tasks.length === 0 ? (
          <div className="no-tasks">Нет задач для отображения</div>
        ) : (
          tasks.map((task, index) => <TaskCard key={task.id || index} task={task} />)
        )}
      </div>
    </div>
  )
}

export default App
