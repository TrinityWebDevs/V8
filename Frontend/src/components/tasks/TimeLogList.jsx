import React, { useState } from 'react';

const TimeLogList = ({ timeLogs = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };
  return (
    <div className="mt-4">
      {/* Collapsible Header */}
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <h4 className="text-sm font-semibold text-gray-300">Time Logs</h4>
        <button className="text-blue-400 text-xs hover:underline focus:outline-none">
          {isExpanded ? 'Hide' : 'Show'}
        </button>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <>
          {timeLogs.length === 0 ? (
            <p className="text-sm text-gray-500 mt-2">No time logs yet</p>
          ) : (
            <div className="space-y-3 mt-3 bg-gray-800 p-4 rounded-xl shadow-inner">
              {timeLogs.map((log, index) => (
                <div
                  key={log._id}
                  className="flex justify-between items-center text-sm bg-gray-900 p-3 rounded-lg border border-gray-700"
                >
                  <div className="text-gray-300">
                    <p className="mb-1">
                      👤 <span className="font-medium">{log.user?.name || 'Unknown User'}</span>
                    </p>
                    <div className="text-gray-400">
                      <span>{formatDate(log.start)}</span>
                      {log.end && (
                        <>
                          <span className="mx-2 text-gray-500">→</span>
                          <span>{formatDate(log.end)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {log.duration && (
                    <span className="text-gray-200 font-semibold">
                      {formatDuration(log.duration)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TimeLogList;
