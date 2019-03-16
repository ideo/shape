import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

class LegendItemCover extends React.Component {
  render() {
    const { item } = this.props
    console.log(this.props)
    return <div>{item.name}</div>
  }
}

export default LegendItemCover
