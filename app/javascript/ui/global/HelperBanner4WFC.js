import { runInAction } from 'mobx'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import v from '~/utils/variables'
import { CloseButton } from '~/ui/global/styled/buttons'
import Banner from '~/ui/layout/Banner'

const HelperBanner4WFC = ({ currentUser }) => (
  <Banner
    color={v.colors.primaryDarkest}
    leftComponent={
      <div style={{ fontSize: '1rem' }}>
        The way Shape's grid works has changed - now you can move or add content
        anywhere you'd like!
        <br />
         Click the +, drag and drop, and add new rows in the location of your
        choice.
      </div>
    }
    rightComponent={
      <CloseButton
        size="lg"
        color={v.colors.commonLight}
        onClick={() => {
          // after creating the card this will get set in the backend
          // so just make it false locally
          runInAction(() => {
            currentUser.show_helper = false
          })
          currentUser.API_updateCurrentUser({
            show_helper: false,
          })
        }}
      />
    }
  />
)

HelperBanner4WFC.propTypes = {
  currentUser: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default HelperBanner4WFC
