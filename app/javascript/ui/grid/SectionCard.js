import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

// import v from '~/utils/variables'

// const { gridH, gridW } = v.defaultGridSettings

// const SectionCardOuter = styled.div`
//   position: relative;
//   top: ${props => props.marginTop}px;
//   left: ${props => props.marginLeft}px;
//   height: calc(100% - ${gridH}px);
//   width: calc(100% - ${gridW}px);
// `

const SectionCardInner = styled.div`
  height: 100%;
  width: 100%;
  outline: 4px solid black;
`

class SectionCard extends React.Component {
  render() {
    // const { card } = this.props
    // const marginTop = gridH / 2
    // const marginLeft = gridW / 2
    return <SectionCardInner />
  }
}

SectionCard.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default SectionCard
