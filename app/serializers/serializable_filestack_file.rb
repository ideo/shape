class SerializableFilestackFile < BaseJsonSerializer
  type 'filestack_files'
  attributes :url, :handle, :size, :mimetype
end
