class User < ApplicationRecord
  has_secure_password
  
  has_many :lists, dependent: :destroy
  
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
end
