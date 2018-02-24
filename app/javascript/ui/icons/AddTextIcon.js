import { propTypes, defaultProps } from './iconProps'

const AddTextIcon = ({ color = 'black', width = 32, height = 32 }) => (
  <svg width={width} height={height} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fillRule="evenodd">
      <g stroke={color} strokeLinecap="round" strokeWidth="4">
        <path d="M68.255 111.27v22.033M79.406 122.421H57.373" />
      </g>
      <path d="M87.19 123.273v-4.408h9.75v-46.88h-7.546c-6.442 0-7.29 2.458-10.173 15.174H76V68h49v19.16h-3.221c-2.883-12.717-3.73-15.176-10.258-15.176h-7.46v46.881h9.749v4.408H87.19z" fill={color} />
    </g>
  </svg>
)

AddTextIcon.propTypes = { ...propTypes }
AddTextIcon.defaultProps = { ...defaultProps }

export default AddTextIcon
