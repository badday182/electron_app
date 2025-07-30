import TaskCard from './components/taskCard/TaskCard.jsx'
// import './components/taskCard/index.css'
function App() {
  const task = {
    title: 'Sample Task',
    description: 'This is a sample task description.',
    completed: false
  }
  return (
    <>
      <TaskCard task={task} />
    </>
  )
}

export default App
