// import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

const StyledDataItemCover = styled.div`
  h4 {
    font-size: 2rem;
  }
  text-align: center;
`

class DataItemCover extends React.PureComponent {
  render() {
    const { item } = this.props
    return (
      <StyledDataItemCover>
        <h4>{item.data_values}</h4>
        <br />
        {item.data_settings.d_measure}
      </StyledDataItemCover>
    )
  }
}

DataItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default DataItemCover
