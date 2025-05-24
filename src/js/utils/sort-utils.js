/**
 * Sort comments by date
 * @param {Array} comments - Array of comment objects
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Array} Sorted comments array
 */
export function sortCommentsByDate(comments, order = 'desc') {
    return [...comments].sort((a, b) => {
      const dateA = new Date(a.date_created);
      const dateB = new Date(b.date_created);
      return order === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }