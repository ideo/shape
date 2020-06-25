import PropTypes from 'prop-types'

// Custom collection icons
import AcceleratorIcon from '~/ui/icons/collection_icons/AcceleratorIcon'
import BrainstormIcon from '~/ui/icons/collection_icons/BrainstormIcon'
import BusinessModelIcon from '~/ui/icons/collection_icons/BusinessModelIcon'
import CelebrateIcon from '~/ui/icons/collection_icons/CelebrateIcon'
import ClipboardIcon from '~/ui/icons/collection_icons/ClipboardIcon'
import ExpertFeedbackIcon from '~/ui/icons/collection_icons/ExpertFeedbackIcon'
import FeedbackIcon from '~/ui/icons/collection_icons/FeedbackIcon'
import FlagIcon from '~/ui/icons/collection_icons/FlagIcon'
import ImplementationIcon from '~/ui/icons/collection_icons/ImplementationIcon'
import InsightIcon from '~/ui/icons/collection_icons/InsightIcon'
import IterationIcon from '~/ui/icons/collection_icons/IterationIcon'
import KickoffIcon from '~/ui/icons/collection_icons/KickoffIcon'
import LightbulbIcon from '~/ui/icons/collection_icons/LightbulbIcon'
import PitchIcon from '~/ui/icons/collection_icons/PitchIcon'
import PlanningIcon from '~/ui/icons/collection_icons/PlanningIcon'
import PresentationIcon from '~/ui/icons/collection_icons/PresentationIcon'
import PrototypingIcon from '~/ui/icons/collection_icons/PrototypingIcon'
import SpreadsheetIcon from '~/ui/icons/collection_icons/SpreadsheetIcon'
import SubmitIcon from '~/ui/icons/collection_icons/SubmitIcon'

// Collection Type icons
import ChallengeIcon from '~/ui/icons/collection_icons/ChallengeIcon'
import DefaultCollectionIcon from '~/ui/icons/collection_icons/DefaultCollectionIcon'
import FoamcoreBoardIcon from '~/ui/icons/collection_icons/FoamcoreBoardIcon'
import MethodIcon from '~/ui/icons/collection_icons/MethodIcon'
import PhaseIcon from '~/ui/icons/collection_icons/PhaseIcon'
import ProfileIcon from '~/ui/icons/ProfileIcon'
import ProjectIcon from '~/ui/icons/collection_icons/ProjectIcon'
import PrototypeIcon from '~/ui/icons/collection_icons/PrototypeIcon'

export const allIcons = {
  accelerator: AcceleratorIcon,
  brainstorm: BrainstormIcon,
  business_model: BusinessModelIcon,
  celebrate: CelebrateIcon,
  challenge: ChallengeIcon,
  clipboard: ClipboardIcon,
  collection: DefaultCollectionIcon,
  expert_feedback: ExpertFeedbackIcon,
  feedback: FeedbackIcon,
  flag: FlagIcon,
  foamcore: FoamcoreBoardIcon,
  implementation: ImplementationIcon,
  insight: InsightIcon,
  iteration: IterationIcon,
  kickoff: KickoffIcon,
  lightbulb: LightbulbIcon,
  method: MethodIcon,
  phase: PhaseIcon,
  pitch: PitchIcon,
  planning: PlanningIcon,
  presentation: PresentationIcon,
  project: ProjectIcon,
  profile: ProfileIcon,
  prototype: PrototypeIcon,
  prototyping: PrototypingIcon,
  spreadsheet: SpreadsheetIcon,
  submit: SubmitIcon,
}

const CollectionIcon = ({ type, size }) => {
  const Icon = allIcons[type]
  return <Icon size={size} />
}

CollectionIcon.propTypes = {
  /** type is the collection icon attribute */
  type: PropTypes.string,
  /** size is one of xs, md, lg, xl, xxl */
  size: PropTypes.string,
}

CollectionIcon.defaultProps = {
  type: 'collection',
  size: 'xs',
}

export default CollectionIcon
