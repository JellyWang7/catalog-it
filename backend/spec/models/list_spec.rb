require 'rails_helper'

RSpec.describe List, type: :model do
  describe 'associations' do
    it { should belong_to(:user) }
    it { should have_many(:items).dependent(:destroy) }
  end

  describe 'validations' do
    it { should validate_presence_of(:title) }
    it { should validate_inclusion_of(:visibility).in_array(%w[public private shared]) }
  end

  describe 'scopes' do
    let!(:user) { create(:user) }
    let!(:public_list1) { create(:list, :public, user: user) }
    let!(:public_list2) { create(:list, :public, user: user) }
    let!(:private_list) { create(:list, visibility: 'private', user: user) }
    let!(:shared_list) { create(:list, :shared, user: user) }

    describe '.public_lists' do
      it 'returns only public lists' do
        expect(List.public_lists).to contain_exactly(public_list1, public_list2)
      end

      it 'does not return private lists' do
        expect(List.public_lists).not_to include(private_list)
      end

      it 'does not return shared lists' do
        expect(List.public_lists).not_to include(shared_list)
      end
    end
  end

  describe 'default values' do
    it 'sets default visibility to private' do
      user = create(:user)
      list = List.create(title: 'Test List', user: user)
      expect(list.visibility).to eq('private')
    end
  end

  describe 'factory' do
    it 'creates a valid list' do
      list = build(:list)
      expect(list).to be_valid
    end

    it 'creates a public list with trait' do
      list = build(:list, :public)
      expect(list.visibility).to eq('public')
    end

    it 'creates a list with items using trait' do
      list = create(:list, :with_items)
      expect(list.items.count).to eq(3)
    end
  end
end
