import React from 'react';

interface CustomerScoreBadgeProps {
  score: number;
}

const CustomerScoreBadge: React.FC<CustomerScoreBadgeProps> = ({ score }) => {
  let colorClasses = '';
  let text = '';

  if (score >= 4) {
    text = 'Sangat Baik';
    colorClasses = 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
  } else if (score >= 3) {
    text = 'Baik';
    colorClasses = 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-400';
  } else if (score >= 2) {
    text = 'Cukup';
    colorClasses = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
  } else {
    text = 'Buruk';
    colorClasses = 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
  }

  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${colorClasses}`} title={`Skor: ${score.toFixed(1)}/5`}>
      {text}
    </span>
  );
};

export default CustomerScoreBadge;
