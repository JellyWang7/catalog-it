class User < ApplicationRecord
  has_secure_password

  has_many :lists, dependent: :destroy
  has_many :comments, dependent: :destroy
  has_many :list_likes, dependent: :destroy
  has_many :item_likes, dependent: :destroy
  has_many :attachments, dependent: :destroy
  
  validates :username, presence: true, uniqueness: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, inclusion: { in: %w[admin user] }
  validates :status, inclusion: { in: %w[active suspended deleted] }
  
  scope :active, -> { where(status: 'active') }
  scope :suspended, -> { where(status: 'suspended') }
  
  def active?
    status == 'active'
  end
  
  def suspended?
    status == 'suspended'
  end
  
  def deleted?
    status == 'deleted'
  end

  # --- MFA (TOTP) ---

  def generate_otp_secret!
    self.otp_secret = ROTP::Base32.random
    save!
    otp_secret
  end

  def otp_provisioning_uri
    totp = ROTP::TOTP.new(otp_secret, issuer: "CatalogIt")
    totp.provisioning_uri(email)
  end

  def verify_otp(code)
    return false unless otp_secret.present?
    totp = ROTP::TOTP.new(otp_secret)
    totp.verify(code.to_s, drift_behind: 30, drift_ahead: 30).present?
  end

  def enable_mfa!
    update!(otp_required_for_login: true)
  end

  def disable_mfa!
    update!(otp_secret: nil, otp_required_for_login: false)
  end

  def mfa_enabled?
    otp_required_for_login? && otp_secret.present?
  end

  # --- Password Reset ---

  # Generate a secure reset token and store it with a 1-hour expiry
  def generate_password_reset_token!
    self.reset_password_token = SecureRandom.urlsafe_base64(32)
    self.reset_password_sent_at = Time.current
    save!
    reset_password_token
  end

  # Check if the reset token is still valid (within 1 hour)
  def password_reset_token_valid?
    reset_password_token.present? && reset_password_sent_at.present? &&
      reset_password_sent_at > 1.hour.ago
  end

  # Reset password and clear the token
  def reset_password!(new_password, new_password_confirmation)
    self.password = new_password
    self.password_confirmation = new_password_confirmation
    self.reset_password_token = nil
    self.reset_password_sent_at = nil
    save
  end
end
