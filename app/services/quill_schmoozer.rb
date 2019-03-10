require 'schmooze'

class QuillSchmoozer < Schmooze::Base
  dependencies Delta: 'quill-delta'

  method :transform, %(
    function(args) {
      const cDelta = new Delta(args[0])
      const rDelta = new Delta(args[1])
      return cDelta.transform(rDelta, true)
    }
  )

  method :compose, %(
    function(args) {
      const docDelta = new Delta(args[0])
      const newDelta = new Delta(args[1])
      return docDelta.compose(newDelta)
    }
  )

  method :delta, %(
    function(d) {
      return new Delta(d)
    }
  )

  def self.schmoozer
    @schmoozer = new(__dir__)
  end

  def self.transform(*args)
    schmoozer.transform(args)
  end

  def self.compose(*args)
    schmoozer.compose(args)
  end

  def self.delta(*args)
    schmoozer.delta(args)
  end
end
