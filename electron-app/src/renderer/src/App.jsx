import { useState, useEffect } from 'react'
import TaskCard from './components/taskCard/TaskCard.jsx'
// import './components/taskCard/index.css'

function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  if (loading) {
    return <div>Загрузка задач...</div>
  }

  if (error) {
    return <div>Ошибка загрузки задач: {error}</div>
  }

  return (
    <>
      {tasks.length === 0 ? (
        <div>Нет задач для отображения</div>
      ) : (
        tasks.map((task, index) => <TaskCard key={task.id || index} task={task} />)
      )}
    </>
  )
}

export default App
