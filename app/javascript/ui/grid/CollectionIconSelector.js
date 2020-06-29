import { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import InlineModal from '~/ui/global/modals/InlineModal'
import { allIcons } from '~/ui/icons/CollectionIcon'
import DropdownIcon from '~/ui/icons/DropdownIcon'
import v from '~/utils/variables'
const IconWrapper = styled.div`
  display: inline-block;
  ${props => (props.noMargin ? '' : 'margin: 5px;')}
  width: 30px;
  height: 30px;
  cursor: pointer;
  .icon {
    width: 30px;
  }
`

const IconSelectorWrapper = styled.div`
  cursor: pointer;
  background-color: ${v.colors.white};
  display: inline-block;
  padding-left: 2px;
`

const CollectionIconSelector = ({ selectedIcon, onSelectIcon }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const selectRef = useRef(null)

  const handleSelectIcon = iconName => {
    setModalOpen(false)
    onSelectIcon(iconName)
  }

  return (
    <div>
      <IconSelectorWrapper onClick={() => setModalOpen(true)} ref={selectRef}>
        <IconWrapper noMargin>{selectedIcon}</IconWrapper>{' '}
        <IconWrapper>
          <DropdownIcon />
        </IconWrapper>
      </IconSelectorWrapper>
      <InlineModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        anchorElement={selectRef && selectRef.current}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        hideButtons
      >
        <div style={{ width: '160px', minHeight: '160px' }}>
          {Object.keys(allIcons).map(iconName => {
            const Icon = allIcons[iconName]
            return (
              <IconWrapper onClick={() => handleSelectIcon(iconName)}>
                <Icon size={'lg'} />
              </IconWrapper>
            )
          })}
        </div>
      </InlineModal>
    </div>
  )
}

CollectionIconSelector.propTypes = {
  selectedIcon: PropTypes.node.isRequired,
  onSelectIcon: PropTypes.func.isRequired,
}

export default CollectionIconSelector
