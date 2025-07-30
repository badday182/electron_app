// import React from 'react'
import './index.css'

const TaskCard = ({ task, onEdit, onDelete, onToggleComplete }) => {
  const handleDelete = () => {
    if (window.confirm(`Вы уверены, что хотите удалить задачу "${task.title}"?`)) {
      onDelete(task.id)
    }
  }

  const handleToggleComplete = () => {
    if (onToggleComplete) {
      onToggleComplete(task.id, task.completed)
    }
  }

  return (
    <div className="task-card">
      {task.completed && (
        <div
          className="task-completed-indicator"
          onClick={handleToggleComplete}
          title="Нажмите, чтобы отметить как невыполненную"
        ></div>
      )}
      {!task.completed && (
        <div
          className="task-incomplete-indicator"
          onClick={handleToggleComplete}
          title="Нажмите, чтобы отметить как выполненную"
        ></div>
      )}
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      {/* <p>
        Статус: <strong>{task.completed ? 'Виконана' : 'Не виконана'}</strong>
      </p> */}
      <div className="task-card-actions">
        <button onClick={() => onEdit && onEdit(task)}>Edit</button>
        <button onClick={handleDelete} className="delete-button">
          Delete
        </button>
      </div>
    </div>
  )
}

export default TaskCard
