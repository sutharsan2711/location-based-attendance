export const formatDate = (dateStr?: string | Date): string => {
  if (!dateStr) return '--';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const formatTime = (timeStr?: string | Date): string => {
  if (!timeStr) return '--';
  const date = new Date(timeStr);
  if (isNaN(date.getTime())) {
    // If it's just a time string (e.g. HH:mm:ss), try parsing it
    try {
      const parts = String(timeStr).split(':');
      if (parts.length >= 2) {
        let hrs = parseInt(parts[0], 10);
        const mins = parts[1];
        const ampm = hrs >= 12 ? 'PM' : 'AM';
        hrs = hrs % 12;
        hrs = hrs ? hrs : 12; // the hour '0' should be '12'
        return `${String(hrs).padStart(2, '0')}:${mins} ${ampm}`;
      }
    } catch (e) {
      return String(timeStr);
    }
    return String(timeStr);
  }
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

export const formatDateTime = (dateTimeStr?: string | Date): string => {
  if (!dateTimeStr) return '--';
  return `${formatDate(dateTimeStr)} ${formatTime(dateTimeStr)}`;
};
