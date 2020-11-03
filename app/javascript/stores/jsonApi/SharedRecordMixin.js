import CollaboratingMixin from '~/stores/jsonApi/mixins/CollaboratingMixin'
import TitleAndCoverEditingMixin from '~/stores/jsonApi/mixins/TitleAndCoverEditingMixin'
import BaseMixin from '~/stores/jsonApi/mixins/BaseMixin'

const SharedRecordMixin = superclass =>
  CollaboratingMixin(TitleAndCoverEditingMixin(BaseMixin(superclass)))

export default SharedRecordMixin
