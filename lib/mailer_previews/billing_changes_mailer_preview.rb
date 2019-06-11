class BillingChangesMailerPreview < ActionMailer::Preview
  def notify
    u = User.find_by_email 'smith+manage-invoices@substantial.com'
    BillingChangesMailer.notify(u.current_organization.id, 3)
  end
end
