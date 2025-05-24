
export function formatEventDates() {
    document.querySelectorAll('.user-meta .time').forEach(timeElement => {
      const dateStr = timeElement.textContent.trim();
      if (dateStr) {
        try {
          const date = new Date(dateStr);
          if (!isNaN(date)) {
            timeElement.textContent = formatDate(date);
          }
        } catch (e) {
          console.error("Error formatting created date:", e);
        }
      }
    });
  
    document.querySelectorAll('.event-date').forEach(dateElement => {
      const iconSpan = dateElement.querySelector('.icon');
      const dateText = dateElement.textContent.replace(iconSpan?.textContent || '', '').trim();
      
      if (dateText) {
        try {
          const date = new Date(dateText);
          if (!isNaN(date)) {
            dateElement.innerHTML = `${iconSpan?.outerHTML || ''} ${formatDate(date, true)}`;
          }
        } catch (e) {
          console.error("Error formatting scheduled date:", e);
        }
      }
    });
  }
 export function formatRelativeDate(dateString) {
  if (!dateString) return 'Unknown date';
  
  let commentDate;
  try {
      commentDate = new Date(dateString);
      
      if (isNaN(commentDate.getTime())) {
          console.error('Invalid date:', dateString);
          return 'Invalid date';
      }
  } catch (e) {
      console.error('Error parsing date:', e);
      return 'Invalid date';
  }
  
  const now = new Date();
  commentDate.setHours(commentDate.getHours() + 3)

  const diffInSeconds = Math.floor((now - commentDate) / 1000);
  
  if (diffInSeconds < 60) {
      return 'just now';
  }
  
  if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  
  return new Intl.DateTimeFormat('uk-UA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Europe/Kiev'
  }).format(commentDate);
}

export function formatISODate(dateString) {
  if (!dateString) return '';
  
  try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      return date.toISOString();
  } catch (e) {
      console.error('Error formatting ISO date:', e);
      return '';
  }
}

function formatDate(date, includeTime = false) {
  const now = new Date();
  
  const isUkraineSummerTime = isDateInUkraineDST(now);
  const ukraineOffset = isUkraineSummerTime ? 180 : 120;
  
  const adjustedNow = new Date(now.getTime() + (ukraineOffset - now.getTimezoneOffset()) * 60000);
  const adjustedDate = new Date(date.getTime() + (ukraineOffset - date.getTimezoneOffset()) * 60000);
  
  const isToday = adjustedDate.toDateString() === adjustedNow.toDateString();
  const isThisYear = adjustedDate.getFullYear() === adjustedNow.getFullYear();
  
  const options = {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      timeZone: 'Europe/Kiev'
  };
  
  if (!isThisYear) {
      options.year = 'numeric';
  }
  
  if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
  }
  
  let formattedDate = date.toLocaleDateString('uk-UA', options);
  
  if (isToday) {
      if (includeTime) {
          formattedDate = `Today at ${date.toLocaleTimeString('uk-UA', {
              hour: '2-digit', 
              minute: '2-digit',
              timeZone: 'Europe/Kiev'
          })}`;
      } else {
          formattedDate = 'Today';
      }
  }
  
  return formattedDate;
}

function isDateInUkraineDST(date) {
  const year = date.getFullYear();
  
  const marchLastDay = new Date(year, 2, 31);
  while (marchLastDay.getDay() !== 0) {
      marchLastDay.setDate(marchLastDay.getDate() - 1);
  }
  
  const octoberLastDay = new Date(year, 9, 31);
  while (octoberLastDay.getDay() !== 0) {
      octoberLastDay.setDate(octoberLastDay.getDate() - 1);
  }
  
  const dstStart = new Date(marchLastDay);
  dstStart.setHours(3, 0, 0, 0);
  
  const dstEnd = new Date(octoberLastDay);
  dstEnd.setHours(4, 0, 0, 0);
  
  return date >= dstStart && date < dstEnd;
}