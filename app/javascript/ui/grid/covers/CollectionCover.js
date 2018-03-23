import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import _ from 'lodash'
import styled from 'styled-components'

import v from '~/utils/variables'

const StyledCardCover = styled.div`
  width: 100%;
  height: 100%;
  background: ${v.colors.cloudy};
  color: ${v.colors.blackLava};
  position: relative;
  overflow: hidden;
  ${props => (props.url && `
    background-image: url(${props.url});
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    color: white;
    text-shadow: 1px 1px ${v.colors.blackLava};
  `
  )}
`
StyledCardCover.displayName = 'StyledCardCover'

const StyledCardContent = styled.div`
  position: absolute;
  left: 5%;
  top: 20%;
  padding: 1rem;
  ${props => (props.width > 1 && `
    top: 33%;
    left: 40%;
    padding-right: 2rem;
  `
  )}
  h3 {
    text-transform: uppercase;
    font-size: 2rem;
    margin-bottom: 0.25rem;
    line-height: 1.2;
  }
`
StyledCardContent.displayName = 'StyledCardContent'

class CollectionCover extends React.Component {
  render() {
    const { height, width, collection } = this.props
    const { cover } = collection
    const name_length = width > 1 ? 150 : 30
    const text_length = width > 1 ? 300 : 100
    const separator = /,?\.* +/
    return (
      <StyledCardCover url={cover.image_url}>
        <StyledCardContent height={height} width={width} >
          <h3>
            {_.truncate(cover.name, { length: name_length, separator })}
          </h3>
          <p>
            {_.truncate(cover.text, { length: text_length, separator })}
          </p>
        </StyledCardContent>
      </StyledCardCover>
    )
  }
}

CollectionCover.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollectionCover
