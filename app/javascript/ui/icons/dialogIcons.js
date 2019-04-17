// NOTE: we import this one as just AlertIcon for consistency
import AlertIcon from '~/ui/icons/AlertIcon'
import ArchiveIcon from '~/ui/icons/ArchiveIcon'
import BackIcon from '~/ui/icons/BackIcon'
import CelebrateIcon from '~/ui/icons/CelebrateIcon'
import ClockIcon from '~/ui/icons/ClockIcon'
import CloseIcon from '~/ui/icons/CloseIcon'
import CloseSubtractGroupIcon from '~/ui/icons/CloseSubtractGroupIcon'
import HiddenIcon from '~/ui/icons/HiddenIcon'
import InfoIcon from '~/ui/icons/InfoIcon'
import LeaveIcon from '~/ui/icons/LeaveIcon'
import LinkIcon from '~/ui/icons/LinkIcon'
import MailIcon from '~/ui/icons/MailIcon'
import OkIcon from '~/ui/icons/OkIcon'
import OverdueClockIcon from '~/ui/icons/OverdueClockIcon'
import TemplateIcon from '~/ui/icons/TemplateIcon'
import TestGraphIcon from '~/ui/icons/TestGraphIcon'

export const iconNames = [
  'Alert',
  'Archive',
  'Back',
  'Celebrate',
  'Close',
  'CloseSubtractGroup',
  'Clock',
  'Hidden',
  'Leave',
  'Link',
  'Mail',
  'Ok',
  'OverdueClock',
  'Template',
  'TestGraph',
]

export default {
  AlertIcon,
  ArchiveIcon,
  BackIcon,
  CelebrateIcon,
  ClockIcon,
  CloseIcon,
  CloseSubtractGroupIcon,
  HiddenIcon,
  InfoIcon,
  LeaveIcon,
  LinkIcon,
  MailIcon,
  OkIcon,
  OverdueClockIcon,
  TemplateIcon: () => <TemplateIcon circled />,
  TestGraphIcon,
}
