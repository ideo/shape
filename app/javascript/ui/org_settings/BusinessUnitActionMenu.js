import PropTypes from 'prop-types'
import { useState } from 'react'

import PopoutMenu from '~/ui/global/PopoutMenu'
import DuplicateIcon from '~/ui/icons/DuplicateIcon'
import EditPencilIconXs from '~/ui/icons/EditPencilIconXs'
import TrashIconXl from '~/ui/icons/TrashIconXl'
import ConfirmationDialog from '~/ui/global/modals/ConfirmationDialog'

const BusinessUnitActionMenu = ({
  handleClone,
  handleRemove,
  handleRename,
  name,
}) => {
  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const isOpen = () => (modalOpen ? 'confirm' : '')

  const onMouseLeave = e => {
    e.preventDefault()
    setOpen(false)
  }

  const onClick = e => {
    e.preventDefault()
    setOpen(true)
  }

  const handleCloneClick = e => {
    e.preventDefault()
    handleClone()
    setOpen(false)
  }

  const handleRemoveClick = e => {
    e.preventDefault()
    setModalOpen(true)
  }

  const handleRenameClick = e => {
    e.preventDefault()
    handleRename()
    setOpen(false)
  }

  const confirmRemove = () => {
    handleRemove()
    setOpen(false)
  }

  const cancelRemove = () => {
    setModalOpen(false)
    setOpen(false)
  }

  return (
    <React.Fragment>
      <ConfirmationDialog
        prompt={`Are you sure you want to delete ${name}? This action cannot be undone.`}
        onConfirm={() => confirmRemove()}
        onCancel={() => cancelRemove()}
        onClose={() => setModalOpen(false)}
        open={isOpen()}
        iconName="Alert"
      />
      <PopoutMenu
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        menuOpen={open}
        menuItems={[
          {
            name: 'Rename',
            onClick: handleRenameClick,
            iconRight: <EditPencilIconXs />,
          },
          {
            name: 'Clone',
            onClick: handleCloneClick,
            iconRight: <DuplicateIcon />,
          },
          {
            name: 'Remove',
            onClick: handleRemoveClick,
            iconRight: <TrashIconXl />,
          },
        ]}
      />
    </React.Fragment>
  )
}

BusinessUnitActionMenu.propTypes = {
  name: PropTypes.string.isRequired,
  handleClone: PropTypes.func.isRequired,
  handleRemove: PropTypes.func.isRequired,
  handleRename: PropTypes.func.isRequired,
}

export default BusinessUnitActionMenu
