import TitleAndCoverEditingMixin from '~/stores/jsonApi/mixins/TitleAndCoverEditingMixin'
import BaseMixin from '~/stores/jsonApi/mixins/BaseMixin'

const SharedRecordMixin = superclass =>
  TitleAndCoverEditingMixin(BaseMixin(superclass))

export default SharedRecordMixin
