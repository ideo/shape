import styled from 'styled-components'

import v from '~/utils/variables'

const PaddedCardCover = styled.div`
  position: relative;
  z-index: ${v.zIndex.gridCardBg + 1};
  padding: 1rem;
  border-bottom: ${props => (!props.isEditing ? '2px solid black' : 'none')};
  background-color: ${props =>
    !props.isEditing ? v.colors.commonLight : v.colors.white};

  .form {
    text-align: center;
    input {
      padding-top: 5px;
      margin-bottom: 10px;
    }
  }
`

export default PaddedCardCover
