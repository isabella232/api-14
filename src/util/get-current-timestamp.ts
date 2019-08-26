/**
 * Returns the current timestamp as milliseconds since epoch.
 */
export default function getCurrentTimestamp(): number {
  return (new Date().getTime());
}