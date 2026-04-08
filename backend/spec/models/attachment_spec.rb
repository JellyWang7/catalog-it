require 'rails_helper'

RSpec.describe Attachment, type: :model do
  let(:user) { create(:user) }
  let(:list) { create(:list, :public, user: user) }

  describe 'associations' do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:attachable) }
  end

  describe 'validations' do
    it 'requires kind to be one of link, image, file, note' do
      attachment = described_class.new(user: user, attachable: list, kind: 'invalid')
      expect(attachment).not_to be_valid
      expect(attachment.errors[:kind]).to be_present
    end

    it 'requires a valid https url for link attachments' do
      attachment = described_class.new(
        user: user,
        attachable: list,
        kind: 'link',
        title: 'Bad Link',
        url: 'http://insecure.example.com'
      )

      expect(attachment).not_to be_valid
      expect(attachment.errors[:url]).to include('must be a valid https link')
    end

    it 'accepts a valid https url for link attachments' do
      attachment = described_class.new(
        user: user,
        attachable: list,
        kind: 'link',
        title: 'Docs',
        url: 'https://example.com/docs'
      )

      expect(attachment).to be_valid
    end

    it 'accepts note attachments with body' do
      attachment = described_class.new(
        user: user,
        attachable: list,
        kind: 'note',
        title: '',
        body: 'Just a text note'
      )

      expect(attachment).to be_valid
    end
  end
end
