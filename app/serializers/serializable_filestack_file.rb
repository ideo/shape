class SerializableFilestackFile < BaseJsonSerializer
  type 'filestack_files'
  attributes :filename, :url, :handle, :size, :mimetype, :docinfo
end
