class User < ApplicationRecord
  has_secure_password
  
  has_many :lists, dependent: :destroy
  
  validates :username, presence: true, uniqueness: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, inclusion: { in: %w[admin user] }
end
