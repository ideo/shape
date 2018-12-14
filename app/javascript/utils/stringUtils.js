// https://paulund.co.uk/how-to-capitalize-the-first-letter-of-a-string-in-javascript
export function capitalizeSnakecase(string) {
  return string
    .split('_')
    .map(substring => substring.charAt(0).toUpperCase() + substring.slice(1))
    .join(' ')
}

export default { capitalizeSnakecase }
