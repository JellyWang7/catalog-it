require 'rails_helper'

RSpec.describe 'Security Features', type: :model do
  describe 'User Status Management' do
    let(:user) { create(:user) }

    it 'creates users with active status by default' do
      expect(user.status).to eq('active')
      expect(user).to be_active
    end

    it 'allows valid status values' do
      user.status = 'suspended'
      expect(user).to be_valid
      
      user.status = 'deleted'
      expect(user).to be_valid
    end

    it 'rejects invalid status values' do
      user.status = 'invalid_status'
      expect(user).not_to be_valid
      expect(user.errors[:status]).to include('is not included in the list')
    end

    describe 'status scopes' do
      let!(:active_user) { create(:user, status: 'active') }
      let!(:suspended_user) { create(:user, email: 'suspended@test.com', username: 'suspended', status: 'suspended') }
      let!(:deleted_user) { create(:user, email: 'deleted@test.com', username: 'deleted', status: 'deleted') }

      it 'filters active users' do
        expect(User.active).to include(active_user)
        expect(User.active).not_to include(suspended_user, deleted_user)
      end

      it 'filters suspended users' do
        expect(User.suspended).to include(suspended_user)
        expect(User.suspended).not_to include(active_user, deleted_user)
      end
    end
  end

  describe 'XSS Prevention' do
    let(:user) { create(:user) }

    describe 'List description sanitization' do
      it 'strips script tags from description' do
        list = create(:list, user: user, description: '<script>alert("XSS")</script>Safe text')
        expect(list.description).not_to include('<script>')
        expect(list.description).to include('Safe text')
      end

      it 'strips onclick attributes' do
        list = create(:list, user: user, description: '<div onclick="alert(1)">Click me</div>')
        expect(list.description).not_to include('onclick')
      end

      it 'strips iframe tags' do
        list = create(:list, user: user, description: '<iframe src="evil.com"></iframe>Text')
        expect(list.description).not_to include('<iframe>')
        expect(list.description).to include('Text')
      end

      it 'allows basic HTML formatting' do
        list = create(:list, user: user, description: '<b>Bold</b> and <i>italic</i>')
        expect(list.description).to include('<b>Bold</b>')
        expect(list.description).to include('<i>italic</i>')
      end

      it 'handles nil description' do
        list = create(:list, user: user, description: nil)
        expect(list.description).to be_nil
      end
    end

    describe 'Item notes sanitization' do
      let(:list) { create(:list, user: user) }

      it 'strips script tags from notes' do
        item = create(:item, list: list, notes: '<script>document.cookie</script>Safe notes')
        expect(item.notes).not_to include('<script>')
        expect(item.notes).to include('Safe notes')
      end

      it 'strips event handlers' do
        item = create(:item, list: list, notes: '<img src=x onerror="alert(1)">')
        expect(item.notes).not_to include('onerror')
      end

      it 'strips style tags with malicious content' do
        item = create(:item, list: list, notes: '<style>body{background:url("javascript:alert(1)")}</style>Text')
        expect(item.notes).not_to include('<style>')
        expect(item.notes).to include('Text')
      end

      it 'allows basic HTML formatting' do
        item = create(:item, list: list, notes: '<b>Important</b> note')
        expect(item.notes).to include('<b>Important</b>')
      end

      it 'handles nil notes' do
        item = create(:item, list: list, notes: nil)
        expect(item.notes).to be_nil
      end
    end
  end

  describe 'Rating Business Rule Compliance' do
    let(:list) { create(:list) }

    it 'enforces rating between 1-5 (business rule 7)' do
      expect(build(:item, list: list, rating: 1)).to be_valid
      expect(build(:item, list: list, rating: 5)).to be_valid
      expect(build(:item, list: list, rating: 0)).not_to be_valid
      expect(build(:item, list: list, rating: 6)).not_to be_valid
    end

    it 'allows unrated items' do
      expect(build(:item, list: list, rating: nil)).to be_valid
    end
  end

  describe 'Date Validation (Business Rule 8)' do
    let(:user) { create(:user) }
    let(:list) { create(:list, user: user) }

    it 'validates item created_at is not before list created_at' do
      # Create item with proper timestamp
      item = list.items.create(name: 'Test Item', rating: 4)
      expect(item).to be_valid
    end

    it 'prevents backdating items (if manually set)' do
      # This validation only applies if created_at is manually set
      # In normal operation, Rails handles created_at automatically
      item = list.items.build(name: 'Test Item')
      item.created_at = list.created_at - 1.day
      
      expect(item).not_to be_valid
      expect(item.errors[:created_at]).to include('cannot be before the list was created')
    end
  end

  describe 'Visibility Business Rule (Rule 5)' do
    it 'only allows Private, Shared, or Public visibility' do
      user = create(:user)
      
      expect(build(:list, user: user, visibility: 'private')).to be_valid
      expect(build(:list, user: user, visibility: 'shared')).to be_valid
      expect(build(:list, user: user, visibility: 'public')).to be_valid
      expect(build(:list, user: user, visibility: 'invalid')).not_to be_valid
    end
  end
end
