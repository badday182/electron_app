import { useState, useEffect } from 'react'
import TaskCard from './components/taskCard/TaskCard.jsx'
import './assets/app.css'

function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '' })

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)

        // Проверяем, доступно ли API (для разработки в браузере)
        if (window.api && window.api.fetchTasks) {
          // Используем IPC для Electron
          const data = await window.api.fetchTasks()
          setTasks(data)
        } else {
          // Fallback для разработки в браузере
          const response = await fetch('http://localhost:3000/tasks')

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const data = await response.json()
          setTasks(data)
        }
      } catch (err) {
        setError(err.message)
        console.error('Error fetching tasks:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      alert('Пожалуйста, введите название задачи')
      return
    }

    // Функция для создания задачи через прямой HTTP запрос
    const createTaskDirectly = async (taskToCreate) => {
      console.log('Sending direct POST request to create task:', taskToCreate)

      let response
      try {
        response = await fetch('http://localhost:3000/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: taskToCreate.title,
            description: taskToCreate.description,
            completed: taskToCreate.completed
          })
        })
        console.log('Response received successfully')
      } catch (fetchError) {
        console.error('Fetch failed:', fetchError)
        // Проверяем, запущен ли сервер
        try {
          const testResponse = await fetch('http://localhost:3000/', { method: 'GET' })
          console.log('Server is running, test response status:', testResponse.status)
          throw new Error('Сервер доступен, но запрос к /tasks не удался: ' + fetchError.message)
        } catch (serverError) {
          console.error('Server test failed:', serverError)
          throw new Error(
            'Сервер на http://localhost:3000 недоступен. ' + 'Убедитесь, что сервер запущен.'
          )
        }
      }

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      if (!response.ok) {
        // Попытаемся получить детали ошибки от сервера
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData.message) {
            errorMessage += ` - ${errorData.message}`
          }
          if (errorData.error) {
            errorMessage += ` - ${errorData.error}`
          }
        } catch {
          // Если не удается парсить JSON ошибки, используем текст ответа
          try {
            const errorText = await response.text()
            if (errorText) {
              errorMessage += ` - ${errorText}`
            }
          } catch {
            // Игнорируем ошибки парсинга
          }
        }
        throw new Error(errorMessage)
      }

      const createdTask = await response.json()
      setTasks((prevTasks) => [...prevTasks, createdTask])
    }

    try {
      const taskToCreate = {
        id: Date.now(), // Временный ID для локальных задач
        title: newTask.title,
        description: newTask.description,
        completed: false
      }

      // Проверяем, доступно ли API для создания задач
      if (window.api && window.api.createTask) {
        // Используем IPC для Electron
        console.log('Using Electron IPC API to create task:', taskToCreate)
        try {
          const createdTask = await window.api.createTask(taskToCreate)
          console.log('Task created successfully via IPC:', createdTask)
          setTasks((prevTasks) => [...prevTasks, createdTask])
        } catch (ipcError) {
          console.error('IPC createTask failed:', ipcError)
          // Fallback к прямому HTTP запросу если IPC не работает
          console.log('Falling back to direct HTTP request...')
          await createTaskDirectly(taskToCreate)
        }
      } else {
        // Fallback для разработки в браузере - отправляем POST запрос к бэкенду
        console.log('No Electron IPC available, using direct HTTP request')
        await createTaskDirectly(taskToCreate)
      }

      // Очищаем форму и закрываем её
      setNewTask({ title: '', description: '' })
      setShowCreateForm(false)
    } catch (err) {
      console.error('Error creating task:', err)
      alert('Ошибка при создании задачи: ' + err.message)
    }
  }

  const handleCancelCreate = () => {
    setNewTask({ title: '', description: '' })
    setShowCreateForm(false)
  }

  if (loading) {
    return <div>Загрузка задач...</div>
  }

  if (error) {
    return <div>Ошибка загрузки задач: {error}</div>
  }

  return (
    <div>
      <div className="header-section">
        <button className="create-task-button" onClick={() => setShowCreateForm(true)}>
          Создать новую задачу
        </button>
      </div>

      {showCreateForm && (
        <div className="create-task-form">
          <h3>Создание новой задачи</h3>
          <div className="form-group">
            <label>Название:</label>
            <input
              type="text"
              className="form-input"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Введите название задачи"
            />
          </div>
          <div className="form-group">
            <label>Описание:</label>
            <textarea
              className="form-textarea"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Введите описание задачи (необязательно)"
            />
          </div>
          <div className="form-buttons">
            <button className="btn-primary" onClick={handleCreateTask}>
              Создать
            </button>
            <button className="btn-secondary" onClick={handleCancelCreate}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="no-tasks">Нет задач для отображения</div>
      ) : (
        tasks.map((task, index) => <TaskCard key={task.id || index} task={task} />)
      )}
    </div>
  )
}

export default App
