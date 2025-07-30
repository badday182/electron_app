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
 * Удаляет задачу через прямой HTTP запрос
 * @param {number|string} taskId - ID задачи для удаления
 * @returns {Promise<boolean>} true если задача успешно удалена
 */
const deleteTaskDirectly = async (taskId) => {
  console.log('Sending direct DELETE request for task:', taskId)
  console.log('URL:', `http://localhost:3000/tasks/${taskId}`)

  try {
    const response = await fetch(`http://localhost:3000/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      mode: 'cors'
    })

    console.log('Delete response received successfully, status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    // Для DELETE запросов часто возвращается 204 (No Content) или 200
    if (response.ok) {
      console.log('Task deleted successfully')
      return true
    } else {
      // Попытаемся получить детали ошибки от сервера
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        console.log('Error response data:', errorData)
        if (errorData.message) {
          errorMessage += ` - ${errorData.message}`
        }
        if (errorData.error) {
          errorMessage += ` - ${errorData.error}`
        }
      } catch {
        try {
          const errorText = await response.text()
          console.log('Error response text:', errorText)
          if (errorText) {
            errorMessage += ` - ${errorText}`
          }
        } catch {
          // Игнорируем ошибки парсинга
        }
      }
      throw new Error(errorMessage)
    }
  } catch (fetchError) {
    console.error('Delete fetch failed with error:', fetchError)
    console.error('Error name:', fetchError.name)
    console.error('Error message:', fetchError.message)
    console.error('Error stack:', fetchError.stack)

    // Если это ошибка сети (TypeError), то сервер недоступен
    if (fetchError instanceof TypeError) {
      // Попробуем сначала проверить, доступен ли сервер вообще
      try {
        console.log('Testing server availability...')
        const testResponse = await fetch('http://localhost:3000/', { method: 'GET' })
        console.log('Server test response status:', testResponse.status)
        throw new Error(
          `Сервер доступен (статус ${testResponse.status}), но DELETE запрос к /tasks/${taskId} не удался: ${fetchError.message}`
        )
      } catch (testError) {
        console.error('Server test also failed:', testError)
        throw new Error(
          'Сервер на http://localhost:3000 недоступен. Убедитесь, что сервер запущен.'
        )
      }
    }

    // Если это другая ошибка, передаем её как есть
    throw fetchError
  }
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

/**
 * Удаляет задачу
 * @param {number|string} taskId - ID задачи для удаления
 * @returns {Promise<boolean>} true если задача успешно удалена
 */
export const deleteTask = async (taskId) => {
  console.log('Attempting to delete task with ID:', taskId)

  // Проверяем, доступно ли API для удаления задач через IPC
  if (window.api && window.api.deleteTask) {
    // Используем IPC для Electron
    console.log('Using Electron IPC API to delete task:', taskId)
    try {
      const result = await window.api.deleteTask(taskId)
      console.log('Task deleted successfully via IPC:', result)
      return result
    } catch (ipcError) {
      console.error('IPC deleteTask failed:', ipcError)
      // Fallback к прямому HTTP запросу если IPC не работает
      console.log('Falling back to direct HTTP request...')
      return await deleteTaskDirectly(taskId)
    }
  } else {
    // Fallback для разработки в браузере - отправляем DELETE запрос к бэкенду
    console.log('No Electron IPC available, using direct HTTP request for task ID:', taskId)
    return await deleteTaskDirectly(taskId)
  }
}
