require 'rails_helper'

RSpec.describe Comment, type: :model do
  describe 'content moderation' do
    let(:user) { create(:user) }
    let(:list) { create(:list, :public) }

    it 'rejects profane comment body' do
      comment = build(:comment, user: user, list: list, body: 'this is shit')
      expect(comment).not_to be_valid
      expect(comment.errors.full_messages).to include('Content contains inappropriate language.')
    end

    it 'rejects obfuscated slur variants in comment body' do
      comment = build(:comment, user: user, list: list, body: 'n1gg@')
      expect(comment).not_to be_valid
      expect(comment.errors.full_messages).to include('Content contains inappropriate language.')
    end

    it 'rejects anti-Asian slur ching chong (not matched by chink alone)' do
      comment = build(:comment, user: user, list: list, body: 'chingchong')
      expect(comment).not_to be_valid
      expect(comment.errors.full_messages).to include('Content contains inappropriate language.')
    end
  end
end
