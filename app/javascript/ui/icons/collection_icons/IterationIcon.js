import PropTypes from 'prop-types'
import Icon from '~/ui/icons/Icon'

const IterationIcon = ({ size }) => (
  <Icon fill>
    {size === 'lg' && (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <path d="M29.012 18.996l-1.891-1.947a.65.65 0 10-.932.905l.934.962c-1.059.129-2.673.246-4.262.043 1.618-1.076 2.708-2.638 2.708-4.65 0-1.489-.478-2.748-1.38-3.639-.81-.8-1.9-1.241-3.071-1.241-2.236 0-4.5 1.676-4.5 4.879 0 1.857.646 3.323 1.918 4.357.195.159.402.304.617.436-1.366.316-2.831.398-4.273.149 1.14-.894 1.738-2.098 1.738-3.512 0-1.162-.362-2.142-1.048-2.835a3.295 3.295 0 00-2.365-.972c-1.753 0-3.527 1.308-3.527 3.808 0 1.463.677 2.689 1.86 3.556a7.723 7.723 0 01-2.791-.004c.564-.62.851-1.475.851-2.55 0-1.019-.424-1.645-.779-1.991a2.467 2.467 0 00-1.733-.697c-1.245 0-2.505.934-2.505 2.72 0 .896.34 1.687.944 2.322a7.573 7.573 0 01-1.872-.315.65.65 0 00-.399 1.237c.107.035 2.207.701 3.972.188.827.332 1.815.515 2.915.515a8.657 8.657 0 003.094-.55c2.125.746 5.262.69 7.775-.269 2.03.588 4.316.513 5.845.355l-.666.686a.65.65 0 00.934.906l1.891-1.947a.65.65 0 00-.002-.905zm-21.48-.353c-.08.058-.166.11-.256.156-.828-.434-1.396-1.102-1.396-2.024 0-1.048.648-1.42 1.204-1.42.316 0 .609.116.826.328.253.247.386.613.386 1.061.001.902-.249 1.524-.764 1.899zm6.228-.186a4.718 4.718 0 01-.557.311c-1.282-.557-2.225-1.521-2.225-3.027 0-1.723 1.153-2.507 2.227-2.507.555 0 1.066.208 1.44.586.439.445.672 1.109.672 1.921.001 1.129-.523 2.043-1.557 2.716zm7.173.06a5.337 5.337 0 01-1.576-.858c-.968-.787-1.438-1.882-1.438-3.349 0-2.459 1.658-3.579 3.199-3.579 1.568 0 3.15 1.106 3.15 3.579.001 1.906-1.4 3.354-3.335 4.207z" />
      </svg>
    )}
    {size === 'xxl' && (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360">
        <path d="M339.4 222.9L316 198.8c-1.9-2-5.1-2-7.1-.1s-2 5.1-.1 7.1l15.8 16.2c-14.1 2-42.2 4.9-68 0 1.3-.7 2.5-1.4 3.7-2.2 23.3-14.2 35.6-33.9 35.6-57 0-17.6-5.6-32.4-16.2-42.9-9.5-9.3-22.2-14.5-35.9-14.5-13.8 0-26.6 5.2-36.2 14.6-10.7 10.5-16.4 25.3-16.4 42.8 0 22 7.6 39.4 22.6 51.6 4.2 3.4 8.9 6.3 13.9 8.8-12.6 3.7-26.2 5.6-39.9 5.6-11.1 0-20.7-1.1-28.9-3.1.3-.2.7-.4 1-.7 16.5-10.7 25.2-26.1 25.2-44.6 0-13.6-4.2-25-12.1-33-7.1-7.2-16.7-11.1-27.1-11.1-20.2 0-40.6 15.1-40.6 44.1 0 18.7 9 34.1 25.9 44.5.5.3 1.1.6 1.6 1-7.8 2.1-16.3 3.2-24.9 3.2-7.9 0-16-1-23.5-3 9.1-7.2 13.7-18.4 13.7-33.2 0-19.8-14.1-30.2-28.1-30.2-7.4 0-14.2 2.8-19.3 7.8-3.9 3.9-8.7 11-8.7 22.8 0 13.8 6.5 24.2 16.5 31.7-15.6 1.2-31.7-3.9-32-3.9-2.6-.8-5.4.6-6.3 3.2-.9 2.6.6 5.4 3.2 6.3 1.3.4 27.5 8.7 48.6 2 10.9 4.5 23.5 6.6 35.7 6.6 13.7 0 26.8-2.4 38.3-7 12.1 4.4 26.4 6.7 41.6 6.7 18.9 0 37.9-3.6 54.4-10 29 8.8 62.8 6.1 80.9 3.6L308.8 247c-1.9 2-1.9 5.1.1 7.1 1 .9 2.2 1.4 3.5 1.4 1.3 0 2.6-.5 3.6-1.5l23.4-24.1c1.9-2 1.9-5 0-7zm-261.9-4c-1.5 1.1-3.2 2.1-5 2.8-11.9-5.8-20.3-15.2-20.3-28.4 0-6.6 2-12 5.7-15.7 3.2-3.2 7.6-4.9 12.3-4.9 8.7 0 18.1 6.3 18.1 20.2-.1 12.1-3.7 20.8-10.8 26zm68.2 2.5c-21.8-9.3-30.4-26-30.4-40.9 0-16.9 10.5-34.1 30.6-34.1 7.7 0 14.8 2.9 20 8.2 6 6.1 9.2 15.1 9.2 25.9 0 18.8-11.2 30-20.7 36.2-2.7 1.7-5.6 3.3-8.7 4.7zm96.1-3.3c-8-2.7-15.4-6.5-21.6-11.5-12.5-10.2-18.9-24.9-18.9-43.8 0-32.5 22.1-47.4 42.7-47.4 28.9 0 42 24.5 42 47.4 0 24.6-16.7 39.9-30.8 48.5-4.2 2.5-8.7 4.8-13.4 6.8z" />
      </svg>
    )}
  </Icon>
)

IterationIcon.propTypes = {
  size: PropTypes.string,
}

IterationIcon.defaultProps = {
  size: 'lg',
}

export default IterationIcon
