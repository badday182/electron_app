// import React from 'react'
import './index.css'

const TaskCard = ({ task, onEdit, onDelete }) => {
  const handleDelete = () => {
    if (window.confirm(`Вы уверены, что хотите удалить задачу "${task.title}"?`)) {
      onDelete(task.id)
    }
  }

  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      {/* <p>
        Статус: <strong>{task.completed ? 'Виконана' : 'Не виконана'}</strong>
      </p> */}
      <div className="task-card-actions">
        <button onClick={() => onEdit && onEdit(task)}>Редагувати</button>
        <button onClick={handleDelete} className="delete-button">
          Видалити
        </button>
      </div>
    </div>
  )
}

export default TaskCard
