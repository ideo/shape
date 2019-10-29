require 'schmooze'

class QuillSchmoozer < Schmooze::Base
  dependencies Delta: 'quill-delta'

  method :diff, 'function(data1, data2) {
    const delta1 = new Delta(data1)
    const delta2 = new Delta(data2)
    return delta1.diff(delta2)
  }'

  def self.instance
    new(__dir__)
  end

  def self.diff(*args)
    instance.diff(*args)
  end
end
