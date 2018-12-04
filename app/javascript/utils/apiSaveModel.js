import { saveModel, modelToJsonApi } from 'datx-jsonapi'
import { updateModelId, getModelMetaKey, setModelMetaKey } from 'datx'
import { pick } from 'lodash'

// MODEL_PERSISTED_KEY matches internals in datx, they don't export
// this so it is possible that this could change when updating datx,
// if it does this will break
const MODEL_PERSISTED_KEY = 'jsonapiPersisted'

const apiSaveModel = function(model, options) {
  if (!model.attributesForAPI) {
    return saveModel(model, options)
  }
  const data = modelToJsonApi(model)
  const attributes = pick(data.attributes, model.attributesForAPI)
  const createOrUpdateRecord = new model.constructor({
    ...attributes,
  })
  const persisted = getModelMetaKey(model, MODEL_PERSISTED_KEY)
  if (persisted) {
    updateModelId(createOrUpdateRecord, model.id)
    setModelMetaKey(createOrUpdateRecord, MODEL_PERSISTED_KEY, persisted)
  }
  return saveModel(createOrUpdateRecord, options)
}

export default apiSaveModel
