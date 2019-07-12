class NotifyBillingChanges
  include Interactor
  require_in_context :organization, :active_users_initial_count, :billable_users_count
  delegate_to_context :organization

  def call
    return unless context.billable_users_count.positive? && new_active_users_count.positive?
    notify
  end

  private

  def new_active_users_count
    organization.active_users_count - context.active_users_initial_count
  end

  def notify
    BillingChangesMailer.notify(
      organization.id, new_active_users_count
    ).deliver_later
  end
end
