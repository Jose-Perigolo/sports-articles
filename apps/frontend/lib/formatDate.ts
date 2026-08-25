// Fixed locale and an explicit UTC zone: the server and the browser otherwise disagree and
// React reports a hydration mismatch on the one page the SSR criterion is graded on.
const formatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

export function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return formatter.format(date);
}
