class TrialExpiredMailerPreview < ActionMailer::Preview
  def notify
    TrialExpiredMailer.notify(Organization.last)
  end
end
