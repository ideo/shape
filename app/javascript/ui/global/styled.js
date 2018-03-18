import Dialog from 'material-ui/Dialog'
import styled from 'styled-components'
import v from '~/utils/variables'

export const BctButton = styled.button`
`
BctButton.displayName = 'BctButton'

// Typography Styles

export const Heading2 = styled.h2`
  font-family: {v.fonts.sans};
  font-size: 1.5rem;
  font-weight: {v.weights.medium};
  letter-spacing: 1.4375rem;
  color: ${v.colors.blackLava};
`
Heading2.displayName = 'Heading2'

const Heading3 = styled.h3`
  text-fransform: uppercase;
  margin-bottom: 13px;
  font-size: 0.9375rem;
  font-weight: ${v.weights.medium};
  letter-spacing: 0.0625rem;
`
Heading3.displayName = 'StyledHeading3'

// Form Styles

export const FormActionsContainer = styled.div`
  padding-bottom: 14px;
  text-align: center;
`
FormActionsContainer.displayName = 'StyledFormActionsContainer'

export const FieldContainer = styled.div`
  padding-bottom: 35px;

  label {
    margin-right: 15px;
  }
`
FieldContainer.displayName = 'StyledFieldContainer'

export const Label = styled.label`
  text-transform: uppercase;
  margin-bottom: 20px;
  font-family: ${v.fonts.sans};
  font-size: 1.25rem;
  font-weight: ${v.weights.medium};
  letter-spacing: 1px;
  display: block;
`
Label.displayName = 'StyledLabel'

export const FormButton = styled.button`
  width: 183px;
  text-transform: uppercase;
  font-family: ${v.fonts.sans};
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.09375rem;
  height: 40px;
  cursor: pointer;
  color: #ffffff;
  border-radius: 20px;
  border: none;
  background-color: ${v.colors.blackLava};
`
FormButton.displayName = 'StyledFormButton'

export const TextField = styled.input`
  width: 225px;
  padding-right: 4px;
  padding-left: 4px;
  padding-bottom: 6px;
  outline-width: 0;
  font-size: 1rem;
  border: 0;
  border-bottom: 0.5px solid ${v.colors.gray};

  &::placeholder {
    color: ${v.colors.gray};
  }

  &:focus {
    outline-width: 0;
  }
`
TextField.displayName = 'StyledTextField'

export const FormSpacer = styled.div`
  margin-bottom: 55px;
`
FormSpacer.displayName = 'StyledFormSpacer'

const ImageField = styled.span`
  width: 100px;
  position: relative;
  height: 100px;
  display: block;
  color: white;
  border-radius: 50%;
  background-color: ${v.colors.gray};

  span {
    position: absolute;
    font-size: 36px;
    font-weight: ${v.weights.book};
    left: calc(50% - 8px);
    top: calc(50% - 23px);
  }
`
ImageField.displayName = 'StyledImageField'

// Modals

export const Modal = styled(Dialog)`
  &.paper: {
    border-left: 17px solid ${v.colors.blackLava};
    max-width: 855px;
    width: 100%
  }
`
Modal.displayName = 'StyledDialog'

export const ModalCloseButton = styled.button`
  cursor: pointer;
  display: block;
  right: 28px;
  position: absolute;
  top: 24px;
  width: 14px;
`
ModalCloseButton.displayName = 'ModalCloseButton'
