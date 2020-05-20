const PatternLine = ({ backgroundColor = '' } = {}) => (
  <svg height="5" width="5" xmlns="http://www.w3.org/2000/svg" version="1.1">
    <defs>
      <pattern id="PatternLine" patternUnits="userSpaceOnUse" width="5" height="5">
        <rect width='5' height='5' fill="transparent" class="pattern-bg" />
        <path d='M0 5L5 0ZM6 4L4 6ZM-1 1L1 -1Z' stroke='#120f0e' stroke-width='1'/>
      </pattern>
    </defs>
  </svg>
)

export default PatternLine
