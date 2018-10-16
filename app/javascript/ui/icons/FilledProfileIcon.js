import v from '~/utils/variables'
import Icon from './Icon'

const FilledProfileIcon = () => (
  <Icon fill>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
      <g id="Layer_2" data-name="Layer 2">
        <circle style={{ fill: v.colors.black }} cx="25" cy="25" r="23.5" />
      </g>
      <g id="Layer_1" data-name="Layer 1">
        <path
          style={{ fill: '#fff' }}
          d="M25,27a7.61,7.61,0,1,1,7.61-7.61A7.58,7.58,0,0,1,25,27Zm0-13.53a5.92,5.92,0,1,0,5.92,5.92A5.89,5.89,0,0,0,25,13.44Z"
        />
        <path
          style={{ fill: '#fff' }}
          d="M25,2.91A22.09,22.09,0,1,0,47.09,25,22.18,22.18,0,0,0,25,2.91ZM12.69,41.26V39a7.24,7.24,0,0,1,7.23-7.24H31.3a6,6,0,0,1,6,6v3.48a20.37,20.37,0,0,1-24.62,0ZM39,39.85V37.78a7.74,7.74,0,0,0-7.71-7.7H19.92A8.93,8.93,0,0,0,11,39V40a20.45,20.45,0,1,1,28-.1Z"
        />
      </g>
    </svg>
  </Icon>
)

export default FilledProfileIcon
