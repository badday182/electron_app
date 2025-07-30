import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false, // Разрешаем запросы к localhost
      nodeIntegration: false,
      contextIsolation: true,
      allowRunningInsecureContent: true,
      experimentalFeatures: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()
})

// IPC handler для получения задач
ipcMain.handle('fetch-tasks', async () => {
  try {
    // Импортируем fetch для Node.js (если нужно)
    const fetch = (await import('node-fetch')).default
    const response = await fetch('http://localhost:3000/tasks')

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching tasks in main process:', error)
    throw error
  }
})

// IPC handler для создания задач
ipcMain.handle('create-task', async (event, task) => {
  try {
    console.log('Main process: Creating task with data:', task)
    console.log('Main process: Node.js version:', process.version)

    // Используем встроенный fetch если доступен, иначе node-fetch
    let fetchFunction
    if (typeof fetch !== 'undefined') {
      console.log('Main process: Using built-in fetch')
      fetchFunction = fetch
    } else {
      console.log('Main process: Using node-fetch')
      fetchFunction = (await import('node-fetch')).default
    }

    console.log('Main process: Sending POST request to http://localhost:3000/tasks')

    // Убираем поле id из запроса, так как сервер должен генерировать его сам
    const taskForServer = {
      title: task.title,
      description: task.description,
      completed: task.completed
    }
    const requestBody = JSON.stringify(taskForServer)
    console.log('Main process: Request body:', requestBody)

    const response = await fetchFunction('http://localhost:3000/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: requestBody
    })

    console.log('Main process: Response status:', response.status)
    console.log('Main process: Response statusText:', response.statusText)

    if (!response.ok) {
      // Попытаемся получить больше информации об ошибке
      let errorDetails = `HTTP error! status: ${response.status}`
      try {
        const errorText = await response.text()
        console.log('Main process: Error response body:', errorText)
        errorDetails += ` - ${errorText}`
      } catch (textError) {
        console.log('Main process: Could not read error response body:', textError.message)
      }
      throw new Error(errorDetails)
    }

    const data = await response.json()
    console.log('Main process: Task created successfully:', data)
    return data
  } catch (error) {
    console.error('Error creating task in main process:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    throw error
  }
})

// IPC handler для удаления задач
ipcMain.handle('delete-task', async (event, taskId) => {
  try {
    console.log('Main process: Deleting task with ID:', taskId)

    // Используем встроенный fetch если доступен, иначе node-fetch
    let fetchFunction
    if (typeof fetch !== 'undefined') {
      console.log('Main process: Using built-in fetch for delete')
      fetchFunction = fetch
    } else {
      console.log('Main process: Using node-fetch for delete')
      fetchFunction = (await import('node-fetch')).default
    }

    console.log('Main process: Sending DELETE request to http://localhost:3000/tasks/' + taskId)

    const response = await fetchFunction(`http://localhost:3000/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log('Main process: Delete response status:', response.status)
    console.log('Main process: Delete response statusText:', response.statusText)

    if (!response.ok) {
      let errorDetails = `HTTP error! status: ${response.status}`
      try {
        const errorText = await response.text()
        console.log('Main process: Delete error response body:', errorText)
        errorDetails += ` - ${errorText}`
      } catch (textError) {
        console.log('Main process: Could not read delete error response body:', textError.message)
      }
      throw new Error(errorDetails)
    }

    console.log('Main process: Task deleted successfully')
    return true
  } catch (error) {
    console.error('Error deleting task in main process:', error)
    console.error('Delete error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    throw error
  }
})

// IPC handler для обновления задач
ipcMain.handle('update-task', async (event, taskId, taskData) => {
  try {
    console.log('Main process: Updating task with ID:', taskId, 'Data:', taskData)

    // Используем встроенный fetch если доступен, иначе node-fetch
    let fetchFunction
    if (typeof fetch !== 'undefined') {
      console.log('Main process: Using built-in fetch for update')
      fetchFunction = fetch
    } else {
      console.log('Main process: Using node-fetch for update')
      fetchFunction = (await import('node-fetch')).default
    }

    console.log('Main process: Sending PATCH request to http://localhost:3000/tasks/' + taskId)

    const requestBody = JSON.stringify(taskData)
    console.log('Main process: Update request body:', requestBody)

    const response = await fetchFunction(`http://localhost:3000/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: requestBody
    })

    console.log('Main process: Update response status:', response.status)
    console.log('Main process: Update response statusText:', response.statusText)

    if (!response.ok) {
      let errorDetails = `HTTP error! status: ${response.status}`
      try {
        const errorText = await response.text()
        console.log('Main process: Update error response body:', errorText)
        errorDetails += ` - ${errorText}`
      } catch (textError) {
        console.log('Main process: Could not read update error response body:', textError.message)
      }
      throw new Error(errorDetails)
    }

    const data = await response.json()
    console.log('Main process: Task updated successfully:', data)
    return data
  } catch (error) {
    console.error('Error updating task in main process:', error)
    console.error('Update error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    throw error
  }
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
