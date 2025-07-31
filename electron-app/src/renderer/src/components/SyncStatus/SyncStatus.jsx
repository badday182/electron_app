import './SyncStatus.css'

const SyncStatus = ({ syncing, error, lastSyncTime }) => {
  const formatTime = (date) => {
    if (!date) return ''
    return date.toLocaleTimeString()
  }

  return (
    <div className="sync-status">
      {syncing && <span className="sync-indicator syncing">🔄 Syncing...</span>}

      {!syncing && error && (
        <span className="sync-indicator error" title={error}>
          ⚠️ Sync error
        </span>
      )}

      {!syncing && !error && lastSyncTime && (
        <span className="sync-indicator success" title={`Last sync: ${formatTime(lastSyncTime)}`}>
          ✅ Synced
        </span>
      )}
    </div>
  )
}

export default SyncStatus
