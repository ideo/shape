import PropTypes from 'prop-types'
import Icon from '~/ui/icons/Icon'

const BusinessModelIcon = ({ size }) => (
  <Icon fill>
    {size === 'lg' && (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <path d="M26.553 8.148H5.447a.65.65 0 00-.65.65v14.607c0 .359.291.65.65.65h21.106a.65.65 0 00.65-.65V8.798a.65.65 0 00-.65-.65zm-.65 10.414h-2.962V9.448h2.962v9.114zm-7.156 0V14.69h2.893v3.873h-2.893zm-4.193 0V9.448h2.893v9.114h-2.893zm-4.264 0V14.69h2.963v3.873H10.29zm2.963-5.172H10.29V9.448h2.963v3.942zm8.387 0h-2.893V9.448h2.893v3.942zM8.99 9.448v9.114H6.097V9.448H8.99zM6.097 19.862h9.253v2.894H6.097v-2.894zm10.554 2.894v-2.894h9.252v2.894h-9.252z" />
        <circle cx="24.736" cy="20.82" r=".769" />
        <circle cx="16" cy="14.04" r=".769" />
        <path d="M11.807 9.707h1.118v1.118h-1.118zM24.317 9.707h1.118v1.118h-1.118zM11.807 15.019h1.118v1.118h-1.118zM20.207 15.788l-.768 1.327h1.537zM6.502 21.519H8.04l-.769-1.335z" />
      </svg>
    )}
    {size === 'xxl' && (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360">
        <path d="M331 70.5H29c-2.8 0-5 2.2-5 5v209c0 2.8 2.2 5 5 5h302c2.8 0 5-2.2 5-5v-209c0-2.8-2.2-5-5-5zm-5 149h-51v-139h51v139zm-111 0v-64h50v64h-50zm-60 0v-139h50v139h-50zm-61 0v-64h51v64H94zm51-74H94v-65h51v65zm120 0h-50v-65h50v65zm-181-65v139H34v-139h50zm-50 149h141v50H34v-50zm151 50v-50h141v50H185z" />
        <circle cx="305" cy="247.5" r="11" />
        <circle cx="180" cy="150.5" r="11" />
        <path d="M120 88.5h16v16h-16zM299 88.5h16v16h-16zM120 164.5h16v16h-16zM240.2 175.5l-11 19h22zM44.1 257.5h22l-11-19.1z" />
      </svg>
    )}
  </Icon>
)

BusinessModelIcon.propTypes = {
  size: PropTypes.string,
}

BusinessModelIcon.defaultProps = {
  size: 'lg',
}

export default BusinessModelIcon
