require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'associations' do
    it { should have_many(:lists).dependent(:destroy) }
  end

  describe 'validations' do
    subject { build(:user) }

    it { should validate_presence_of(:username) }
    it { should validate_uniqueness_of(:username) }
    it { should validate_presence_of(:email) }
    it { should validate_uniqueness_of(:email) }
    it { should allow_value('user@example.com').for(:email) }
    it { should_not allow_value('invalid_email').for(:email) }
    it { should validate_inclusion_of(:role).in_array(%w[admin user]) }
    it { should have_secure_password }
  end

  describe 'default values' do
    it 'sets default role to user' do
      user = User.create(username: 'testuser', email: 'test@example.com', password: 'password123')
      expect(user.role).to eq('user')
    end
  end

  describe 'factory' do
    it 'creates a valid user' do
      user = build(:user)
      expect(user).to be_valid
    end

    it 'creates an admin user with trait' do
      admin = build(:user, :admin)
      expect(admin.role).to eq('admin')
    end
  end
end
