import PropTypes from 'prop-types'
import './TaskTabs.css'

const TaskTabs = ({ activeTab, onTabChange, taskCounts }) => {
  const tabs = [
    { id: 'all', label: 'All Tasks', count: taskCounts.all },
    { id: 'pending', label: 'Pending Tasks', count: taskCounts.pending },
    { id: 'completed', label: 'Completed Tasks', count: taskCounts.completed }
  ]

  return (
    <div className="task-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
          <span className="task-count">({tab.count})</span>
        </button>
      ))}
    </div>
  )
}

TaskTabs.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  taskCounts: PropTypes.shape({
    all: PropTypes.number.isRequired,
    pending: PropTypes.number.isRequired,
    completed: PropTypes.number.isRequired
  }).isRequired
}

export default TaskTabs
