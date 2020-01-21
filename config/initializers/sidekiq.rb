module Sidekiq
  module Worker
    module ClassMethods
      # Adds method that can be used to perform job synchronously
      def perform_sync(*args)
        new.perform(*args)
      end
    end
  end
end
