class BaseWorker
  include Sidekiq::Worker
  include Process

  # Override all workers to only retry up to 5 times
  # Default is 25 with expontial backoff and so they would run over 25 days
  # Overriding this to 5 means its only retried over a period
  # of approximately 7 minutes.
  # This will prevent failed job or issues from running later when not desired.
  sidekiq_options retry: 5

  def start_worker_process
    if ENV['RAILS_ENV'] == 'test' || ENV['RAILS_ENV'] == 'test_integration'
      yield
    else
      ActiveRecord::Base.clear_active_connections!
      pid = fork do
        ActiveRecord::Base.connection_pool.with_connection do
          yield
        end
      end
      waitpid(pid)
    end
  end
end
