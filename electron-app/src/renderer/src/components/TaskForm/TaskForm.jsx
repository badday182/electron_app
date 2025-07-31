import { useState, useEffect } from 'react'
import './TaskForm.css'

/**
 * Компонент формы для создания или редактирования задачи
 */
const TaskForm = ({ onSubmit, onCancel, editTask = null }) => {
  const [formData, setFormData] = useState({ title: '', description: '', completed: false })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Заполняем форму данными задачи при редактировании
  useEffect(() => {
    if (editTask) {
      setFormData({
        title: editTask.title || '',
        description: editTask.description || '',
        completed: editTask.completed || false
      })
    } else {
      setFormData({ title: '', description: '', completed: false })
    }
  }, [editTask])

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('Пожалуйста, введите название задачи')
      return
    }

    try {
      setIsSubmitting(true)
      if (editTask) {
        // При редактировании передаем ID задачи и новые данные
        await onSubmit(editTask.id, formData)
      } else {
        // При создании передаем только данные
        await onSubmit(formData)
      }
      // Очищаем форму после успешного создания/обновления
      setFormData({ title: '', description: '', completed: false })
    } catch (error) {
      alert(`Ошибка при ${editTask ? 'обновлении' : 'создании'} задачи: ` + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({ title: '', description: '', completed: false })
    onCancel()
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="create-task-form">
      <h3>{editTask ? 'Edit task' : 'Add new task'}</h3>

      <div className="form-group">
        <label>Title:</label>
        <input
          type="text"
          className="form-input"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter task title"
          disabled={isSubmitting}
        />
      </div>

      <div className="form-group">
        <label>Description:</label>
        <textarea
          className="form-textarea"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Enter task description (optional)"
          disabled={isSubmitting}
        />
      </div>

      <div className="form-group">
        <label>Status:</label>
        <select
          className="form-input"
          value={formData.completed}
          onChange={(e) => handleInputChange('completed', e.target.value === 'true')}
          disabled={isSubmitting}
        >
          <option value="true">Completed</option>
          <option value="false">Pending</option>
        </select>
      </div>

      <div className="form-buttons">
        <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (editTask ? 'Updating...' : 'Adding...') : editTask ? 'Update' : 'Add'}
        </button>
        <button className="btn-secondary" onClick={handleCancel} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default TaskForm
