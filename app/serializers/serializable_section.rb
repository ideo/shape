class SerializableSection < BaseJsonSerializer
  type 'section'

  attributes(
    :id,
    :name,
    :width,
    :height,
    :row,
    :col,
    :parent_id,
  )

  belongs_to :parent
end
