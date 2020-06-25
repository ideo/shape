import { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import InlineModal from '~/ui/global/modals/InlineModal'
import { allIcons } from '~/ui/icons/CollectionIcon'
import ChevronRightIcon from '~/ui/icons/ChevronRightIcon'
import v from '~/utils/variables'

const IconWrapper = styled.div`
  display: inline-block;
  margin: 5px;
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
`

const CustomIconSelector = ({ selectedIcon, onSelectIcon }) => {
  const [open, setOpen] = useState(false)
  const selectRef = useRef(null)

  const handleSelectIcon = iconName => {
    setOpen(false)
    onSelectIcon(iconName)
  }

  return (
    <div>
      <IconSelectorWrapper onClick={() => setOpen(true)} ref={selectRef}>
        <IconWrapper>{selectedIcon}</IconWrapper>{' '}
        <IconWrapper>
          <ChevronRightIcon />
        </IconWrapper>
      </IconSelectorWrapper>
      <InlineModal open={open} anchorElement={selectRef} hideButtons>
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

CustomIconSelector.propTypes = {
  selectedIcon: PropTypes.node.isRequired,
  onSelectIcon: PropTypes.func.isRequired,
}

export default CustomIconSelector
