import TaskCard from './components/taskCard/TaskCard.jsx'
// import './components/taskCard/index.css'
function App() {
  const tasks = [
    {
      title: 'Sample Task',
      description: 'This is a sample task description.',
      completed: false
    },
    {
      title: 'Another Task',
      description: 'This is another task description.',
      completed: true
    },
    {
      title: 'Third Task',
      description: 'This is the third task description.',
      completed: false
    }
  ]
  return (
    <>
      {tasks.map((task, index) => (
        <TaskCard key={index} task={task} />
      ))}
    </>
  )
}

export default App
