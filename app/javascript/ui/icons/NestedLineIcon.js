import React from 'react'
import Icon from './Icon'
import v from '~/utils/variables'

const NestedLineIcon = () => (
  <Icon fill>
    <svg
      width="1"
      height="10"
      viewBox="0 0 1 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        x1="0.5"
        y1="0.5"
        x2="0.5"
        y2="9.5"
        stroke={v.colors.commonDark}
        strokeLinecap="round"
      />
    </svg>
  </Icon>
)

export default NestedLineIcon
