import { useState, useEffect, useRef, useCallback } from 'react'
import * as taskService from '../services/taskService'

// Константы для синхронизации
const SYNC_INTERVAL_MS = 10000 // 10 секунд
const VISIBILITY_SYNC_DELAY_MS = 1000 // 1 секунда после получения фокуса

/**
 * Кастомный хук для работы с задачами
 */
export const useTasks = () => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState(null)
  const [lastSyncTime, setLastSyncTime] = useState(null)
  const syncIntervalRef = useRef(null)
  const visibilityTimeoutRef = useRef(null)

  // Функция для загрузки задач из сервера
  const loadTasks = useCallback(async (showLoading = true, showSyncIndicator = false) => {
    try {
      if (showLoading) setLoading(true)
      if (showSyncIndicator) setSyncing(true)

      const data = await taskService.fetchTasks()
      setTasks(data)
      setError(null)
      setSyncError(null)
      setLastSyncTime(new Date())
    } catch (err) {
      setError(err.message)
      setSyncError(err.message)
      console.error('Error fetching tasks:', err)
    } finally {
      if (showLoading) setLoading(false)
      if (showSyncIndicator) setSyncing(false)
    }
  }, [])

  // Функция для синхронизации в фоновом режиме
  const syncTasks = useCallback(async () => {
    try {
      setSyncing(true)
      const serverTasks = await taskService.fetchTasks()

      // Сравниваем с текущими задачами
      const tasksChanged = !areTasksEqual(tasks, serverTasks)

      if (tasksChanged) {
        setTasks(serverTasks)
        console.log('Tasks synchronized with server')
      }

      setSyncError(null)
      setLastSyncTime(new Date())
    } catch (err) {
      console.error('Background sync failed:', err)
      setSyncError(err.message)
      // В фоновой синхронизации не показываем ошибки пользователю
    } finally {
      setSyncing(false)
    }
  }, [tasks])

  // Функция для сравнения массивов задач
  const areTasksEqual = (localTasks, serverTasks) => {
    if (localTasks.length !== serverTasks.length) return false

    const sortById = (a, b) => a.id - b.id
    const sortedLocal = [...localTasks].sort(sortById)
    const sortedServer = [...serverTasks].sort(sortById)

    return sortedLocal.every((localTask, index) => {
      const serverTask = sortedServer[index]
      return (
        localTask.id === serverTask.id &&
        localTask.title === serverTask.title &&
        localTask.description === serverTask.description &&
        localTask.completed === serverTask.completed
      )
    })
  }

  // Загрузка задач при монтировании компонента
  useEffect(() => {
    loadTasks(true, false)
  }, [loadTasks])

  // Настройка автоматической синхронизации
  useEffect(() => {
    // Запускаем синхронизацию каждые 10 секунд
    syncIntervalRef.current = setInterval(() => {
      syncTasks()
    }, SYNC_INTERVAL_MS)

    // Очищаем интервал при размонтировании
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [syncTasks])

  // Синхронизация при получении фокуса страницей
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Страница стала видимой, синхронизируемся через небольшую задержку
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current)
        }

        visibilityTimeoutRef.current = setTimeout(() => {
          syncTasks()
        }, VISIBILITY_SYNC_DELAY_MS)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current)
      }
    }
  }, [syncTasks])

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
      // При ошибке создания задачи пересинхронизируемся с сервером
      await loadTasks(false, true)
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
      // При ошибке удаления пересинхронизируемся с сервером
      await loadTasks(false, true)
      throw err
    }
  }

  // Функция для обновления задачи
  const handleUpdateTask = async (taskId, taskData) => {
    try {
      const updatedTask = await taskService.updateTask(taskId, taskData)
      setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? updatedTask : task)))
      return updatedTask
    } catch (err) {
      console.error('Error updating task:', err)
      // При ошибке обновления пересинхронизируемся с сервером
      await loadTasks(false, true)
      throw err
    }
  }

  return {
    tasks,
    loading,
    error,
    syncing,
    syncError,
    lastSyncTime,
    createTask: handleCreateTask,
    deleteTask: handleDeleteTask,
    updateTask: handleUpdateTask,
    refreshTasks: () => loadTasks(false, true), // Принудительное обновление
    syncTasks // Ручная синхронизация
  }
}
