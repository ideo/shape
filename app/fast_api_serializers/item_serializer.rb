class ItemSerializer < FastJsonSerializer
  set_type 'items'
  attributes :name, :content
end
