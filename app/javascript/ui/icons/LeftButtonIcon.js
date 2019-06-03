import PropTypes from 'prop-types'

import Icon from './Icon'
import v from '~/utils/variables'

const LeftButtonIcon = ({ disabled }) => (
  <Icon fill>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
      <g>
        <circle cx="25" cy="25" r="24" />
      </g>
      <g>
        <g>
          <defs>
            <path
              id="SVGID_1_"
              d="M26.9,19c0.1,0,0.3,0,0.4,0.1c0.2,0.2,0.2,0.5,0,0.7L22,25l5.2,5.1c0.2,0.2,0.2,0.5,0,0.7s-0.5,0.2-0.8,0
				l-5.6-5.5c-0.2-0.2-0.2-0.5,0-0.7l5.6-5.5C26.6,19.1,26.6,19,26.9,19"
            />
          </defs>
          <clipPath id="SVGID_2_">
            <use xlinkHref="#SVGID_1_" overflow="visible" />
          </clipPath>
          <g clipPath="url(#SVGID_2_)">
            <g>
              <defs>
                <rect
                  id="SVGID_3_"
                  x="-94.7"
                  y="-455"
                  width="1440"
                  height="1292"
                />
              </defs>
              <clipPath id="SVGID_4_">
                <use xlinkHref="#SVGID_3_" overflow="visible" />
              </clipPath>
              <rect
                clipPath="url(#SVGID_4_)"
                fill={disabled ? v.colors.commonDark : v.colors.commonLight}
                x="15.6"
                y="14"
                width="16.7"
                height="22"
              />
            </g>
          </g>
        </g>
      </g>
    </svg>
  </Icon>
)

LeftButtonIcon.propTypes = {
  disabled: PropTypes.bool,
}

LeftButtonIcon.defaultProps = {
  disabled: false,
}

export default LeftButtonIcon
