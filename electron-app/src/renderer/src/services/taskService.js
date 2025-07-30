/**
 * Сервис для работы с API задач
 */

/**
 * Получает список всех задач
 * @returns {Promise<Array>} Список задач
 */
export const fetchTasks = async () => {
  // Проверяем, доступно ли API (для Electron)
  if (window.api && window.api.fetchTasks) {
    // Используем IPC для Electron
    return await window.api.fetchTasks()
  } else {
    // Fallback для разработки в браузере
    const response = await fetch('http://localhost:3000/tasks')

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  }
}

/**
 * Создает новую задачу через прямой HTTP запрос
 * @param {Object} taskData - данные задачи
 * @returns {Promise<Object>} Созданная задача
 */
const createTaskDirectly = async (taskData) => {
  console.log('Sending direct POST request to create task:', taskData)

  let response
  try {
    response = await fetch('http://localhost:3000/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: taskData.title,
        description: taskData.description,
        completed: taskData.completed
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

  return await response.json()
}

/**
 * Создает новую задачу
 * @param {Object} taskData - данные задачи
 * @returns {Promise<Object>} Созданная задача
 */
export const createTask = async (taskData) => {
  const taskToCreate = {
    id: Date.now(), // Временный ID для локальных задач
    title: taskData.title,
    description: taskData.description,
    completed: false
  }

  // Проверяем, доступно ли API для создания задач
  if (window.api && window.api.createTask) {
    // Используем IPC для Electron
    console.log('Using Electron IPC API to create task:', taskToCreate)
    try {
      const createdTask = await window.api.createTask(taskToCreate)
      console.log('Task created successfully via IPC:', createdTask)
      return createdTask
    } catch (ipcError) {
      console.error('IPC createTask failed:', ipcError)
      // Fallback к прямому HTTP запросу если IPC не работает
      console.log('Falling back to direct HTTP request...')
      return await createTaskDirectly(taskToCreate)
    }
  } else {
    // Fallback для разработки в браузере - отправляем POST запрос к бэкенду
    console.log('No Electron IPC available, using direct HTTP request')
    return await createTaskDirectly(taskToCreate)
  }
}
