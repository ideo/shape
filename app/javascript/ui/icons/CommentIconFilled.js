import Icon from './Icon'

const CommentIcon = () => (
  <Icon fill>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
      <defs>
        <path id="a" d="M42.4 6.1c2 0 3.7 1.5 3.7 3.5v22.5c0 1.9-1.7 3.5-3.7 3.5H24.2L13 44.8c-.3.2-.6.4-1 .4-.2 0-.5 0-.7-.1-.6-.3-.9-.8-.9-1.4v-8H8c-2 0-3.7-1.5-3.7-3.5V9.5C4.3 7.6 6 6.1 8 6.1h34.4z" />
      </defs>
      <use xlinkHref="#a" overflow="visible" fillRule="evenodd" clipRule="evenodd" />
      <clipPath id="b">
        <use xlinkHref="#a" overflow="visible" />
      </clipPath>
      <g clipPath="url(#b)">
        <defs>
          <path id="c" d="M-47.4-13.5H66.4v117.2H-47.4z" />
        </defs>
        <use xlinkHref="#c" overflow="visible" />
        <g className="st1">
          <defs>
            <path id="d" d="M4 6.1h44.1v39.1H4z" />
          </defs>
          <use xlinkHref="#d" overflow="visible" />
          <clipPath id="e">
            <use xlinkHref="#d" overflow="visible" />
          </clipPath>
          <path clipPath="url(#e)" d="M-14-13.5h78.5v78.1H-14z" />
        </g>
        <g className="st1">
          <defs>
            <path id="f" d="M-46 2.8h95.4v97.6H-46z" />
          </defs>
          <use xlinkHref="#f" overflow="visible" fillRule="evenodd" clipRule="evenodd" />
          <clipPath id="g">
            <use xlinkHref="#f" overflow="visible" />
          </clipPath>
          <g clipPath="url(#g)">
            <defs>
              <path id="h" d="M4 6.1h44.1v39.1H4z" />
            </defs>
            <use xlinkHref="#h" overflow="visible" />
            <clipPath id="i">
              <use xlinkHref="#h" overflow="visible" />
            </clipPath>
            <path clipPath="url(#i)" d="M-64.4-16.7H67.8V120H-64.4z" />
          </g>
        </g>
      </g>
    </svg>
  </Icon>
)

export default CommentIcon
