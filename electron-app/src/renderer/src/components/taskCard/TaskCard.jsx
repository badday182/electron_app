// import React from 'react'
import './index.css'

const TaskCard = ({ task, onEdit, onDelete }) => {
  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      {/* <p>
        Статус: <strong>{task.completed ? 'Виконана' : 'Не виконана'}</strong>
      </p> */}
      {/* <button onClick={() => onEdit(task)}>Редагувати</button>
      <button onClick={() => onDelete(task.id)}>Видалити</button> */}
      <button>Редагувати</button>
      <button>Видалити</button>
    </div>
  )
}

export default TaskCard
