# Clear existing data
puts "🧹 Clearing existing data..."
Item.destroy_all
List.destroy_all
User.destroy_all

# Create Users
puts "👥 Creating users..."
user1 = User.create!(
  username: "movie_buff",
  email: "movies@example.com",
  password: "password123",
  role: "user"
)

user2 = User.create!(
  username: "bookworm",
  email: "books@example.com",
  password: "password123",
  role: "user"
)

user3 = User.create!(
  username: "collector",
  email: "collector@example.com",
  password: "password123",
  role: "user"
)

# Create Lists with Items
puts "📝 Creating lists..."

# Movie List 1
movie_list1 = List.create!(
  title: "Must-Watch Sci-Fi Movies",
  description: "A curated collection of the best science fiction films of all time",
  visibility: "public",
  user: user1
)

[
  { name: "The Matrix", category: "movies", notes: "Mind-bending reality questioning", rating: 5 },
  { name: "Inception", category: "movies", notes: "Dreams within dreams", rating: 5 },
  { name: "Blade Runner 2049", category: "movies", notes: "Stunning visuals and deep themes", rating: 5 },
  { name: "Interstellar", category: "movies", notes: "Space exploration and time", rating: 4 },
  { name: "Ex Machina", category: "movies", notes: "AI consciousness exploration", rating: 4 }
].each do |item_data|
  movie_list1.items.create!(item_data)
end

# Movie List 2
movie_list2 = List.create!(
  title: "Classic Comedy Collection",
  description: "Timeless comedies that never get old",
  visibility: "public",
  user: user1
)

[
  { name: "The Grand Budapest Hotel", category: "movies", notes: "Wes Anderson masterpiece", rating: 5 },
  { name: "Superbad", category: "movies", notes: "High school comedy gold", rating: 4 },
  { name: "Groundhog Day", category: "movies", notes: "Time loop classic", rating: 5 }
].each do |item_data|
  movie_list2.items.create!(item_data)
end

# Book List 1
book_list1 = List.create!(
  title: "Essential Fantasy Novels",
  description: "Epic fantasy books that transport you to other worlds",
  visibility: "public",
  user: user2
)

[
  { name: "The Name of the Wind", category: "books", notes: "By Patrick Rothfuss - magical storytelling", rating: 5 },
  { name: "The Way of Kings", category: "books", notes: "Brandon Sanderson's epic", rating: 5 },
  { name: "The Hobbit", category: "books", notes: "Tolkien's classic adventure", rating: 5 },
  { name: "Mistborn: The Final Empire", category: "books", notes: "Unique magic system", rating: 4 },
  { name: "The Fifth Season", category: "books", notes: "N.K. Jemisin's powerful world", rating: 5 }
].each do |item_data|
  book_list1.items.create!(item_data)
end

# Book List 2
book_list2 = List.create!(
  title: "Tech & Innovation Reads",
  description: "Books about technology, startups, and innovation",
  visibility: "public",
  user: user2
)

[
  { name: "The Lean Startup", category: "books", notes: "Eric Ries - startup methodology", rating: 4 },
  { name: "Zero to One", category: "books", notes: "Peter Thiel on innovation", rating: 5 },
  { name: "The Innovator's Dilemma", category: "books", notes: "Clayton Christensen classic", rating: 4 }
].each do |item_data|
  book_list2.items.create!(item_data)
end

# Collectibles List
collectibles_list = List.create!(
  title: "Vintage Video Game Collection",
  description: "My prized collection of retro gaming consoles and games",
  visibility: "public",
  user: user3
)

[
  { name: "Nintendo Entertainment System", category: "collectibles", notes: "Original 1985 model with box", rating: 5 },
  { name: "Super Mario Bros 3", category: "collectibles", notes: "Complete in box, mint condition", rating: 5 },
  { name: "Sega Genesis", category: "collectibles", notes: "Model 1 with Sonic the Hedgehog", rating: 4 },
  { name: "Legend of Zelda Gold Cartridge", category: "collectibles", notes: "First edition NES", rating: 5 },
  { name: "Game Boy Color", category: "collectibles", notes: "Atomic Purple limited edition", rating: 4 }
].each do |item_data|
  collectibles_list.items.create!(item_data)
end

# Music List
music_list = List.create!(
  title: "Top Albums of 2024",
  description: "My favorite music releases from this year",
  visibility: "public",
  user: user3
)

[
  { name: "Album Name 1", category: "music", notes: "Artist - Genre blending excellence", rating: 5 },
  { name: "Album Name 2", category: "music", notes: "Artist - Return to form", rating: 4 },
  { name: "Album Name 3", category: "music", notes: "Artist - Experimental masterpiece", rating: 4 }
].each do |item_data|
  music_list.items.create!(item_data)
end

# Private list (won't show in public API)
private_list = List.create!(
  title: "Personal Goals 2026",
  description: "My private goals and aspirations",
  visibility: "private",
  user: user1
)

puts "✅ Seed data created successfully!"
puts "📊 Summary:"
puts "  - #{User.count} users"
puts "  - #{List.count} lists (#{List.where(visibility: 'public').count} public)"
puts "  - #{Item.count} items"
