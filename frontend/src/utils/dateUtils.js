/**
 * Converts a UTC date string (YYYY-MM-DD HH:mm:ss) from SQLite to a local time string.
 * @param {string} utcString - The date string from the backend.
 * @returns {string} - Formatted local date and time.
 */
export const toLocalTime = (utcString) => {
    if (!utcString) return '';
    
    // SQLite DATETIME DEFAULT CURRENT_TIMESTAMP gives 'YYYY-MM-DD HH:mm:ss'
    // We need to ensure the browser treats it as UTC by adding 'Z' 
    // and replacing the space with 'T' for ISO compliance.
    const isoString = utcString.replace(' ', 'T') + 'Z';
    const date = new Date(isoString);
    
    // If the input was already ISO or something else, the above might fail/be weird
    // but for our specific SQLite format it's reliable.
    if (isNaN(date.getTime())) {
        return new Date(utcString).toLocaleString();
    }
    
    return date.toLocaleString();
};

/**
 * Calculates the difference in days between now and an expiry date.
 * Handles UTC strings correctly.
 */
export const getRemainingDays = (utcExpiryString) => {
    if (!utcExpiryString) return 0;
    const isoString = utcExpiryString.replace(' ', 'T') + 'Z';
    const expiryDate = new Date(isoString);
    const now = new Date();
    
    const diffTime = expiryDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
