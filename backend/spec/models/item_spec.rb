require 'rails_helper'

RSpec.describe Item, type: :model do
  describe 'associations' do
    it { should belong_to(:list) }
  end

  describe 'validations' do
    it { should validate_presence_of(:name) }
    it { should validate_inclusion_of(:rating).in_range(0..5).allow_nil }
  end

  describe 'scopes' do
    let!(:list) { create(:list) }
    let!(:movie_item1) { create(:item, list: list, category: 'movies') }
    let!(:movie_item2) { create(:item, list: list, category: 'movies') }
    let!(:book_item) { create(:item, list: list, category: 'books') }

    describe '.by_category' do
      it 'returns items filtered by category' do
        expect(Item.by_category('movies')).to contain_exactly(movie_item1, movie_item2)
      end

      it 'does not return items from other categories' do
        expect(Item.by_category('movies')).not_to include(book_item)
      end
    end
  end

  describe 'rating validation' do
    let(:list) { create(:list) }

    it 'allows rating from 0 to 5' do
      (0..5).each do |rating|
        item = build(:item, list: list, rating: rating)
        expect(item).to be_valid
      end
    end

    it 'allows nil rating' do
      item = build(:item, :unrated, list: list)
      expect(item).to be_valid
    end

    it 'does not allow rating less than 0' do
      item = build(:item, list: list, rating: -1)
      expect(item).not_to be_valid
    end

    it 'does not allow rating greater than 5' do
      item = build(:item, list: list, rating: 6)
      expect(item).not_to be_valid
    end
  end

  describe 'factory' do
    it 'creates a valid item' do
      item = build(:item)
      expect(item).to be_valid
    end

    it 'creates an unrated item with trait' do
      item = build(:item, :unrated)
      expect(item.rating).to be_nil
    end

    it 'creates a highly rated item with trait' do
      item = build(:item, :highly_rated)
      expect(item.rating).to eq(5)
    end
  end
end
