import PropTypes from 'prop-types'
import Icon from '~/ui/icons/Icon'

/*
Previously-defined style on large icon
<style>
  .st0{fill:none;stroke:#000;stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10}
</style>
*/

const SubmitIcon = ({ size }) => (
  <Icon fill>
    {size === 'lg' && (
      <svg
        version="1.1"
        id="Layer_1"
        xmlns="http://www.w3.org/2000/svg"
        x="0"
        y="0"
        viewBox="0 0 32 32"
        xmlSpace="preserve"
      >
        <path
          className="st0"
          d="M16.013 3.361v10.441M20.409 9.777l-4.421 4.413-4.413-4.413M18.624 14.644h3.907l2.543 6.316H18.16a2.163 2.163 0 11-4.328 0H6.919l2.543-6.316h3.941"
        />
        <path className="st0" d="M25.023 20.96v4.547H7.003V20.96" />
      </svg>
    )}
    {size === 'xxl' && (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360">
        <path d="M176.4 180.6c1 1 2.3 1.5 3.5 1.5 1.3 0 2.6-.5 3.5-1.5l52.5-52.4c2-2 2-5.1 0-7.1s-5.1-2-7.1 0l-43.7 43.6V48.5c0-2.8-2.2-5-5-5s-5 2.2-5 5v116.8L131 121.2c-2-2-5.1-2-7.1 0s-2 5.1 0 7.1l52.5 52.3z" />
        <path d="M292.4 255.6l-30.2-75c-.8-1.9-2.6-3.1-4.6-3.1h-46.4c-2.8 0-5 2.2-5 5s2.2 5 5 5h43l26.2 65h-74.7c-2.8 0-5 2.2-5 5 0 11.4-9.3 20.7-20.7 20.7s-20.7-9.3-20.7-20.7c0-2.8-2.2-5-5-5H79.6l26.2-65h43.4c2.8 0 5-2.2 5-5s-2.2-5-5-5h-46.8c-2 0-3.9 1.2-4.6 3.1l-30.2 75c-.6 1.5-.4 3.3.5 4.7 0 .1.1.1.1.2v51c0 2.8 2.2 5 5 5h214c2.8 0 5-2.2 5-5v-51.6c.7-1.3.8-2.9.2-4.3zM78.2 306.5v-44h71.5c2.4 14.6 15.1 25.7 30.3 25.7s27.9-11.1 30.3-25.7h71.9v44h-204z" />
      </svg>
    )}
  </Icon>
)

SubmitIcon.propTypes = {
  size: PropTypes.bool,
}

SubmitIcon.defaultProps = {
  size: 'lg',
}

export default SubmitIcon
