import PropTypes from 'prop-types'
import { Fragment } from 'react'
import styled from 'styled-components'
import { Popover, Grid } from '@material-ui/core'

import v from '~/utils/variables'
import TextButton from '~/ui/global/TextButton'

const ButtonsWrapper = styled.div`
  padding: 20px 30px 15px 30px;
`

const NoGridWrapper = styled.div`
  padding: 5px;
`

/*
 * Creates a "popover" modal, a small modal that opens anchored to an element
 * and doesn't include any background blurring.
 *
 * @component
 */
class InlineModal extends React.PureComponent {
  handleCancel = ev => {
    ev.preventDefault()
    ev.stopPropagation()
    const { onCancel } = this.props
    onCancel && onCancel()
  }

  handleConfirm = ev => {
    ev.preventDefault()
    ev.stopPropagation()
    const { onConfirm } = this.props
    onConfirm && onConfirm()
  }

  get popoverProps() {
    const { anchorElement, open, anchorOrigin } = this.props
    const popProps = {
      anchorOrigin,
      open,
      onClose: this.handleCancel,
    }
    if (anchorElement) {
      popProps.anchorEl = anchorElement
      popProps.anchorReference = 'anchorEl'
    }
    return popProps
  }

  render() {
    const { children, leftButton, noButtons } = this.props
    return (
      <Popover {...this.popoverProps}>
        {noButtons ? (
          <NoGridWrapper>{children}</NoGridWrapper>
        ) : (
          <Fragment>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                {children}
              </Grid>
            </Grid>
            <ButtonsWrapper>
              <Grid container spacing={0}>
                <Grid item xs={4}>
                  {leftButton}
                </Grid>
                <Grid item xs={8} style={{ textAlign: 'right' }}>
                  <TextButton
                    onClick={this.handleCancel}
                    fontSizeEm={0.75}
                    color={v.colors.black}
                    style={{ marginRight: '2em' }}
                    className="cancel-button"
                  >
                    Cancel
                  </TextButton>
                  <TextButton
                    onClick={this.handleConfirm}
                    fontSizeEm={0.75}
                    color={v.colors.black}
                    className="ok-button"
                    data-cy="InlineModal-Ok"
                  >
                    OK
                  </TextButton>
                </Grid>
              </Grid>
            </ButtonsWrapper>
          </Fragment>
        )}
      </Popover>
    )
  }
}

InlineModal.propTypes = {
  /** Whether the modal is open */
  open: PropTypes.bool.isRequired,
  /** The children of the modal, what it's inner content is */
  children: PropTypes.node,
  /** The function to call when clicking the default modal confirm button */
  onConfirm: PropTypes.func,
  /** The function to call when clicking the default modal cancel button */
  onCancel: PropTypes.func,
  /**
   * A button to appear on the left bottom of the modal, should be passed
   * unless noButtons is true
   */
  leftButton: PropTypes.node,
  /** A component to anchor the popover to, it will appear beside it */
  anchorElement: PropTypes.node,
  /** The function to call when clicking the default modal cancel button */
  noButtons: PropTypes.bool,
  /**
   * Origin elements for the anchor, follows MaterialUI's Popover prop
   * of the same name
   */
  anchorOrigin: PropTypes.shape({
    horizontal: PropTypes.string,
    vertical: PropTypes.string,
  }),
}

InlineModal.defaultProps = {
  children: null,
  onConfirm: null,
  onCancel: null,
  leftButton: null,
  anchorElement: null,
  noButtons: false,
  anchorOrigin: { horizontal: 'center', vertical: 'center' },
}

export default InlineModal
