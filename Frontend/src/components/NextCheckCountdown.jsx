import React, { useEffect, useState } from 'react';

function getNextCheckTime(interval, lastChecked) {
  if (!interval || !lastChecked) return null;
  const last = new Date(lastChecked);
  // interval is now in seconds
  const next = new Date(last.getTime() + interval * 1000);
  return next;
}

const NextCheckCountdown = ({ interval, lastChecked }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!interval) {
      setTimeLeft('');
      return;
    }
    if (!lastChecked) {
      setTimeLeft('Next check in 0 sec (waiting for first check...)');
      return;
    }
    const update = () => {
      const next = getNextCheckTime(interval, lastChecked);
      const now = new Date();
      const diff = next - now;
      const sec = Math.max(0, Math.floor(diff / 1000));
      setTimeLeft(`Next check in ${sec} sec`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [interval, lastChecked]);

  return <span className="text-xs text-gray-400 ml-2">{timeLeft}</span>;
};

export default NextCheckCountdown;
