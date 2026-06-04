export const timeAgo = (dateString) => {
  const date = new Date(parseInt(dateString));
  if (isNaN(date)) {
    // Try parsing as regular string if it's not a timestamp
    const fallbackDate = new Date(dateString);
    if (!isNaN(fallbackDate)) {
      return formatRelative(fallbackDate);
    }
    return '';
  }
  return formatRelative(date);
};

const formatRelative = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  // If more than 7 days, show the date like "22 May"
  const options = { day: 'numeric', month: 'short' };
  // If it's a different year, show the year too
  if (now.getFullYear() !== date.getFullYear()) {
    options.year = 'numeric';
  }
  return date.toLocaleDateString('en-US', options);
};
