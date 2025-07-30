import { useState, useEffect } from 'react'
import * as taskService from '../services/taskService'

/**
 * Кастомный хук для работы с задачами
 */
export const useTasks = () => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Загрузка задач при монтировании компонента
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true)
        const data = await taskService.fetchTasks()
        setTasks(data)
      } catch (err) {
        setError(err.message)
        console.error('Error fetching tasks:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [])

  // Функция для создания новой задачи
  const handleCreateTask = async (taskData) => {
    try {
      const createdTask = await taskService.createTask(taskData)
      setTasks((prevTasks) => [...prevTasks, createdTask])
      return createdTask
    } catch (err) {
      console.error('Error creating task:', err)
      throw err
    }
  }

  // Функция для удаления задачи
  const handleDeleteTask = async (taskId) => {
    try {
      await taskService.deleteTask(taskId)
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
      return true
    } catch (err) {
      console.error('Error deleting task:', err)
      throw err
    }
  }

  return {
    tasks,
    loading,
    error,
    createTask: handleCreateTask,
    deleteTask: handleDeleteTask
  }
}
