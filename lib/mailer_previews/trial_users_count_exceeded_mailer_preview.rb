class TrialUsersCountExceededMailerPreview < ActionMailer::Preview
  def notify
    TrialUsersCountExceededMailer.notify(Organization.last)
  end
end
