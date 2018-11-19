// import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

export const StyledDataItemCover = styled.div`
  h4 {
    font-size: 2rem;
  }
  text-align: center;
`
StyledDataItemCover.displayName = 'StyledDataItemCover'

class DataItemCover extends React.PureComponent {
  render() {
    const { item } = this.props
    return (
      <StyledDataItemCover>
        <h4>{item.data.count}</h4>
        <div>{item.data_settings.d_measure}</div>
      </StyledDataItemCover>
    )
  }
}

DataItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default DataItemCover
