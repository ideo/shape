import ArchiveIcon from '~/ui/icons/ArchiveIcon'
import BackIcon from '~/ui/icons/BackIcon'
import CloseIcon from '~/ui/icons/CloseIcon'
import ClockIcon from '~/ui/icons/ClockIcon'
import LeaveIcon from '~/ui/icons/LeaveIcon'
import OkIcon from '~/ui/icons/OkIcon'
// NOTE: we import this one as just AlertIcon for consistency
import AlertIcon from '~/ui/icons/AlertDialogIcon'
import InfoIcon from '~/ui/icons/InfoIcon'
import LinkIcon from '~/ui/icons/LinkIcon'
import TemplateIcon from '~/ui/icons/TemplateIcon'
import TestGraphIcon from '~/ui/icons/TestGraphIcon'
import MailIcon from '~/ui/icons/MailIcon'

export default {
  ArchiveIcon,
  BackIcon,
  CloseIcon,
  ClockIcon,
  LeaveIcon,
  OkIcon,
  AlertIcon,
  InfoIcon,
  LinkIcon,
  TestGraphIcon,
  TemplateIcon: () => <TemplateIcon circled />,
  MailIcon,
}
