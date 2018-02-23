import { PropTypes as MobxPropTypes } from 'mobx-react'
import ReactQuill from 'react-quill'
import styled from 'styled-components'

export const StyledCard = styled.div`
  padding: 1rem;
`

class TextItem extends React.Component {
  render() {
    const { item } = this.props
    // we have to convert it to a normal JS object for Quill to be happy
    const textData = item.toJS().text_data
    return (
      <StyledCard>
        <ReactQuill
          readOnly
          value={textData}
          theme={null}
        />
      </StyledCard>
    )
  }
}

TextItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default TextItem
