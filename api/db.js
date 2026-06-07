const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'olingo.db');
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

function initializeDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      language TEXT NOT NULL,
      level TEXT NOT NULL,
      title TEXT NOT NULL,
      phrases TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS flashcards (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      audio_url TEXT,
      language TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    );

    CREATE TABLE IF NOT EXISTS user_flashcard_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      flashcard_id TEXT NOT NULL,
      interval INTEGER DEFAULT 1,
      ease_factor REAL DEFAULT 2.5,
      repetitions INTEGER DEFAULT 0,
      next_review DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_reviewed DATETIME,
      UNIQUE(user_id, flashcard_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (flashcard_id) REFERENCES flashcards(id)
    );

    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      lesson_id TEXT NOT NULL,
      language TEXT NOT NULL,
      level TEXT NOT NULL,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    );

    CREATE TABLE IF NOT EXISTS user_levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      language TEXT NOT NULL,
      level TEXT NOT NULL,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, language, level),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Migration: Add missing columns if they don't exist
  try {
    db.exec('ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0');
  } catch (e) { /* column already exists */ }
  try {
    db.exec('ALTER TABLE users ADD COLUMN streak INTEGER DEFAULT 0');
  } catch (e) { /* column already exists */ }
}

function seedLessons() {
  const lessonStmt = db.prepare('SELECT COUNT(*) as count FROM lessons');
  if (lessonStmt.get().count === 0) {
    const lessons = [
      // VIETNAMESE - BEGINNER (30 lessons)
      { id: 'vi-b-1', language: 'vietnamese', level: 'beginner', title: '🎤 Greetings & Politeness', phrases: JSON.stringify([{v:'xin chào', e:'hello'}, {v:'tạm biệt', e:'goodbye'}, {v:'cảm ơn', e:'thank you'}, {v:'vâng', e:'yes (polite)'}, {v:'không', e:'no'}]) },
      { id: 'vi-b-2', language: 'vietnamese', level: 'beginner', title: '🔢 Numbers 1-20', phrases: JSON.stringify([{v:'một', e:'one'}, {v:'hai', e:'two'}, {v:'ba', e:'three'}, {v:'bốn', e:'four'}, {v:'năm', e:'five'}, {v:'sáu', e:'six'}, {v:'bảy', e:'seven'}, {v:'tám', e:'eight'}, {v:'chín', e:'nine'}, {v:'mười', e:'ten'}]) },
      { id: 'vi-b-3', language: 'vietnamese', level: 'beginner', title: '🍜 Basic Food Words', phrases: JSON.stringify([{v:'cơm', e:'rice'}, {v:'phở', e:'noodle soup'}, {v:'nước', e:'water'}, {v:'cà phê', e:'coffee'}, {v:'bia', e:'beer'}, {v:'ngon', e:'delicious'}]) },
      { id: 'vi-b-4', language: 'vietnamese', level: 'beginner', title: '👨‍👩‍👧 Family Members', phrases: JSON.stringify([{v:'mẹ', e:'mother'}, {v:'bố', e:'father'}, {v:'chị gái', e:'older sister'}, {v:'em trai', e:'younger brother'}, {v:'vợ', e:'wife'}, {v:'chồng', e:'husband'}]) },
      { id: 'vi-b-5', language: 'vietnamese', level: 'beginner', title: '🎨 Colors & Descriptions', phrases: JSON.stringify([{v:'đỏ', e:'red'}, {v:'xanh', e:'blue/green'}, {v:'vàng', e:'yellow'}, {v:'trắng', e:'white'}, {v:'đen', e:'black'}, {v:'anh/chị', e:'brother/sister'}]) },
      { id: 'vi-b-6', language: 'vietnamese', level: 'beginner', title: '🦁 Animals & Pets', phrases: JSON.stringify([{v:'chó', e:'dog'}, {v:'mèo', e:'cat'}, {v:'chim', e:'bird'}, {v:'cá', e:'fish'}, {v:'con vật', e:'animal'}]) },
      { id: 'vi-b-7', language: 'vietnamese', level: 'beginner', title: '⛅ Weather & Seasons', phrases: JSON.stringify([{v:'nóng', e:'hot'}, {v:'lạnh', e:'cold'}, {v:'mưa', e:'rain'}, {v:'nắng', e:'sunny'}, {v:'mùa hè', e:'summer'}]) },
      { id: 'vi-b-8', language: 'vietnamese', level: 'beginner', title: '👕 Clothes & Fashion', phrases: JSON.stringify([{v:'áo', e:'shirt'}, {v:'quần', e:'pants'}, {v:'giày', e:'shoes'}, {v:'mũ', e:'hat'}, {v:'đẹp', e:'beautiful'}]) },
      { id: 'vi-b-9', language: 'vietnamese', level: 'beginner', title: '😊 Emotions & Feelings', phrases: JSON.stringify([{v:'vui', e:'happy'}, {v:'buồn', e:'sad'}, {v:'giận', e:'angry'}, {v:'sợ', e:'afraid'}, {v:'mệt', e:'tired'}]) },
      { id: 'vi-b-10', language: 'vietnamese', level: 'beginner', title: '⏰ Time & Days', phrases: JSON.stringify([{v:'hôm nay', e:'today'}, {v:'ngày mai', e:'tomorrow'}, {v:'hôm qua', e:'yesterday'}, {v:'tuần', e:'week'}, {v:'tháng', e:'month'}]) },
      { id: 'vi-b-11', language: 'vietnamese', level: 'beginner', title: '🏠 Home & Places', phrases: JSON.stringify([{v:'nhà', e:'house'}, {v:'phòng', e:'room'}, {v:'bếp', e:'kitchen'}, {v:'phòng tắm', e:'bathroom'}, {v:'cửa', e:'door'}]) },
      { id: 'vi-b-12', language: 'vietnamese', level: 'beginner', title: '🏥 Body Parts', phrases: JSON.stringify([{v:'đầu', e:'head'}, {v:'tay', e:'hand'}, {v:'chân', e:'foot'}, {v:'mắt', e:'eye'}, {v:'tai', e:'ear'}]) },
      { id: 'vi-b-13', language: 'vietnamese', level: 'beginner', title: '⚽ Sports & Games', phrases: JSON.stringify([{v:'bóng đá', e:'football'}, {v:'bơi', e:'swimming'}, {v:'chạy', e:'running'}, {v:'chơi', e:'play'}, {v:'thắng', e:'win'}]) },
      { id: 'vi-b-14', language: 'vietnamese', level: 'beginner', title: '🌍 Countries & Nationalities', phrases: JSON.stringify([{v:'Việt Nam', e:'Vietnam'}, {v:'người Việt', e:'Vietnamese person'}, {v:'Mỹ', e:'USA'}, {v:'Nhật', e:'Japan'}, {v:'Trung Quốc', e:'China'}]) },
      { id: 'vi-b-15', language: 'vietnamese', level: 'beginner', title: '🎓 School & Learning', phrases: JSON.stringify([{v:'học', e:'study'}, {v:'sách', e:'book'}, {v:'bút', e:'pen'}, {v:'lớp', e:'class'}, {v:'giáo viên', e:'teacher'}]) },
      { id: 'vi-b-16', language: 'vietnamese', level: 'beginner', title: '🚗 Transportation', phrases: JSON.stringify([{v:'xe', e:'car'}, {v:'máy bay', e:'airplane'}, {v:'tàu', e:'train'}, {v:'xe buýt', e:'bus'}, {v:'đi', e:'go'}]) },
      { id: 'vi-b-17', language: 'vietnamese', level: 'beginner', title: '🏪 Shopping Basics', phrases: JSON.stringify([{v:'mua', e:'buy'}, {v:'bán', e:'sell'}, {v:'giá', e:'price'}, {v:'cửa hàng', e:'shop'}, {v:'tiền', e:'money'}]) },
      { id: 'vi-b-18', language: 'vietnamese', level: 'beginner', title: '🍎 Fruits & Vegetables', phrases: JSON.stringify([{v:'quả táo', e:'apple'}, {v:'chuối', e:'banana'}, {v:'dưa chuột', e:'cucumber'}, {v:'cà rốt', e:'carrot'}, {v:'cam', e:'orange'}]) },
      { id: 'vi-b-19', language: 'vietnamese', level: 'beginner', title: '📚 Reading & Writing', phrases: JSON.stringify([{v:'đọc', e:'read'}, {v:'viết', e:'write'}, {v:'chữ', e:'letter/character'}, {v:'từ', e:'word'}, {v:'câu', e:'sentence'}]) },
      { id: 'vi-b-20', language: 'vietnamese', level: 'beginner', title: '🎵 Music & Arts', phrases: JSON.stringify([{v:'nhạc', e:'music'}, {v:'bài hát', e:'song'}, {v:'hát', e:'sing'}, {v:'vẽ', e:'paint'}, {v:'tranh', e:'painting'}]) },
      { id: 'vi-b-21', language: 'vietnamese', level: 'beginner', title: '📱 Technology Basics', phrases: JSON.stringify([{v:'điện thoại', e:'phone'}, {v:'máy tính', e:'computer'}, {v:'internet', e:'internet'}, {v:'ứng dụng', e:'app'}, {v:'gọi', e:'call'}]) },
      { id: 'vi-b-22', language: 'vietnamese', level: 'beginner', title: '🏋️ Health & Exercise', phrases: JSON.stringify([{v:'khỏe', e:'healthy'}, {v:'đau', e:'pain'}, {v:'tập thể dục', e:'exercise'}, {v:'ngủ', e:'sleep'}, {v:'ăn', e:'eat'}]) },
      { id: 'vi-b-23', language: 'vietnamese', level: 'beginner', title: '👔 Professions', phrases: JSON.stringify([{v:'bác sĩ', e:'doctor'}, {v:'giáo viên', e:'teacher'}, {v:'kỹ sư', e:'engineer'}, {v:'công nhân', e:'worker'}, {v:'nông dân', e:'farmer'}]) },
      { id: 'vi-b-24', language: 'vietnamese', level: 'beginner', title: '💰 Money & Banking', phrases: JSON.stringify([{v:'tiền', e:'money'}, {v:'đồng', e:'Vietnamese dong'}, {v:'ngân hàng', e:'bank'}, {v:'thẻ', e:'card'}, {v:'rút tiền', e:'withdraw'}]) },
      { id: 'vi-b-25', language: 'vietnamese', level: 'beginner', title: '🎉 Celebrations & Holidays', phrases: JSON.stringify([{v:'Tết', e:'Lunar New Year'}, {v:'sinh nhật', e:'birthday'}, {v:'lễ hội', e:'festival'}, {v:'chúc mừng', e:'congratulations'}, {v:'nến', e:'candle'}]) },
      { id: 'vi-b-26', language: 'vietnamese', level: 'beginner', title: '🌳 Nature & Environment', phrases: JSON.stringify([{v:'cây', e:'tree'}, {v:'hoa', e:'flower'}, {v:'nước', e:'water'}, {v:'đất', e:'earth/soil'}, {v:'rừng', e:'forest'}]) },
      { id: 'vi-b-27', language: 'vietnamese', level: 'beginner', title: '⚡ Actions & Verbs', phrases: JSON.stringify([{v:'đứng', e:'stand'}, {v:'ngồi', e:'sit'}, {v:'chạy', e:'run'}, {v:'đi bộ', e:'walk'}, {v:'nằm', e:'lie down'}]) },
      { id: 'vi-b-28', language: 'vietnamese', level: 'beginner', title: '🍴 Dining & Table Manners', phrases: JSON.stringify([{v:'ăn cơm', e:'eat rice'}, {v:'uống nước', e:'drink water'}, {v:'đũa', e:'chopsticks'}, {v:'dĩa', e:'plate'}, {v:'muỗng', e:'spoon'}]) },
      { id: 'vi-b-29', language: 'vietnamese', level: 'beginner', title: '👫 Friends & Relationships', phrases: JSON.stringify([{v:'bạn', e:'friend'}, {v:'thân thiết', e:'close'}, {v:'yêu', e:'love'}, {v:'gặp', e:'meet'}, {v:'nói chuyện', e:'talk'}]) },
      { id: 'vi-b-30', language: 'vietnamese', level: 'beginner', title: '🌙 Night & Evening', phrases: JSON.stringify([{v:'đêm', e:'night'}, {v:'tối', e:'dark'}, {v:'sao', e:'star'}, {v:'mặt trăng', e:'moon'}, {v:'ngủ', e:'sleep'}]) },
      
      // VIETNAMESE - INTERMEDIATE (30 lessons)
      { id: 'vi-i-1', language: 'vietnamese', level: 'intermediate', title: '💬 Casual Conversations', phrases: JSON.stringify([{v:'Bạn khỏe không?', e:'How are you?'}, {v:'Tôi khỏe, cảm ơn', e:"I'm well, thanks"}, {v:'Bạn tên gì?', e:'What is your name?'}, {v:'Tôi tên là...', e:'My name is...'}, {v:'Bạn đến từ đâu?', e:'Where are you from?'}]) },
      { id: 'vi-i-2', language: 'vietnamese', level: 'intermediate', title: '🍽️ Ordering Food at Restaurant', phrases: JSON.stringify([{v:'Tôi muốn ăn phở', e:'I want to eat pho'}, {v:'Gọi cho tôi một cái này', e:'Get me this one'}, {v:'Khác gì?', e:'Any difference?'}, {v:'Không cay', e:'Not spicy'}, {v:'Tính tiền!', e:'Check please!'}]) },
      { id: 'vi-i-3', language: 'vietnamese', level: 'intermediate', title: '💕 Flirting & Making Friends', phrases: JSON.stringify([{v:'Bạn rất xinh!', e:'You are very beautiful!'}, {v:'Tôi rất vui gặp bạn', e:'I am very happy to meet you'}, {v:'Bạn có bạn trai không?', e:'Do you have a boyfriend?'}, {v:'Tôi muốn biết bạn hơn', e:'I want to know you better'}, {v:'Bạn có trên Facebook không?', e:'Are you on Facebook?'}]) },
      { id: 'vi-i-4', language: 'vietnamese', level: 'intermediate', title: '🛍️ Shopping & Bargaining', phrases: JSON.stringify([{v:'Cái này bao nhiêu tiền?', e:'How much is this?'}, {v:'Quá đắt!', e:'Too expensive!'}, {v:'Có rẻ hơn không?', e:'Is there something cheaper?'}, {v:'Cộng lại bao nhiêu?', e:'How much total?'}, {v:'Tôi chỉ có...', e:'I only have...'}]) },
      { id: 'vi-i-5', language: 'vietnamese', level: 'intermediate', title: '📍 Asking for Directions', phrases: JSON.stringify([{v:'Cái này ở đâu?', e:'Where is this?'}, {v:'Đi vào phố này', e:'Go down this street'}, {v:'Rẽ trái', e:'Turn left'}, {v:'Rẽ phải', e:'Turn right'}, {v:'Gần đây', e:'Very close'}]) },
      { id: 'vi-i-6', language: 'vietnamese', level: 'intermediate', title: '🏨 Hotel & Accommodation', phrases: JSON.stringify([{v:'Tôi muốn đặt phòng', e:'I want to book a room'}, {v:'Phòng đơn hay phòng đôi?', e:'Single or double room?'}, {v:'Có wifi không?', e:'Is there wifi?'}, {v:'Check-out lúc mấy giờ?', e:'What time is checkout?'}, {v:'Hóa đơn', e:'bill/invoice'}]) },
      { id: 'vi-i-7', language: 'vietnamese', level: 'intermediate', title: '🏥 Doctor & Hospital', phrases: JSON.stringify([{v:'Tôi bị ốm', e:'I am sick'}, {v:'Đau đầu', e:'headache'}, {v:'Đi khám bác sĩ', e:'See a doctor'}, {v:'Kê đơn thuốc', e:'Prescription'}, {v:'Bệnh viện', e:'hospital'}]) },
      { id: 'vi-i-8', language: 'vietnamese', level: 'intermediate', title: '🎬 Movies & Entertainment', phrases: JSON.stringify([{v:'Xem phim', e:'watch movie'}, {v:'Phim hay', e:'good movie'}, {v:'Diễn viên', e:'actor'}, {v:'Rạp chiếu', e:'cinema'}, {v:'Vé xem phim', e:'movie ticket'}]) },
      { id: 'vi-i-9', language: 'vietnamese', level: 'intermediate', title: '🎵 Music & Concerts', phrases: JSON.stringify([{v:'Hát karaoke', e:'sing karaoke'}, {v:'Đêm nhạc', e:'concert'}, {v:'Nhạc sĩ', e:'musician'}, {v:'Ban nhạc', e:'band'}, {v:'Yêu thích bài hát này', e:'Love this song'}]) },
      { id: 'vi-i-10', language: 'vietnamese', level: 'intermediate', title: '🏃 Sports & Activities', phrases: JSON.stringify([{v:'Chơi bóng đá', e:'play football'}, {v:'Bơi lội', e:'swimming'}, {v:'Chạy bộ', e:'jogging'}, {v:'Đi bộ leo núi', e:'hiking'}, {v:'Giải thể thao', e:'sports competition'}]) },
      { id: 'vi-i-11', language: 'vietnamese', level: 'intermediate', title: '📞 Phone Conversations', phrases: JSON.stringify([{v:'Alô?', e:'Hello?'}, {v:'Bạn là ai?', e:'Who are you?'}, {v:'Xin chuyển cho...', e:'Transfer me to...'}, {v:'Gọi lại sau', e:'Call back later'}, {v:'Tín hiệu kém', e:'Bad signal'}]) },
      { id: 'vi-i-12', language: 'vietnamese', level: 'intermediate', title: '✈️ Travel Planning', phrases: JSON.stringify([{v:'Vé máy bay', e:'flight ticket'}, {v:'Hộ chiếu', e:'passport'}, {v:'Visa', e:'visa'}, {v:'Du lịch', e:'travel/tourism'}, {v:'Bản đồ', e:'map'}]) },
      { id: 'vi-i-13', language: 'vietnamese', level: 'intermediate', title: '🍽️ Cooking & Recipes', phrases: JSON.stringify([{v:'Nấu ăn', e:'cook'}, {v:'Công thức', e:'recipe'}, {v:'Nướng', e:'bake'}, {v:'Xào', e:'stir-fry'}, {v:'Nêm', e:'season'}]) },
      { id: 'vi-i-14', language: 'vietnamese', level: 'intermediate', title: '💼 Job Interview', phrases: JSON.stringify([{v:'Tuyên bố vị trí', e:'job position'}, {v:'Kinh nghiệm làm việc', e:'work experience'}, {v:'Lương', e:'salary'}, {v:'Hợp đồng', e:'contract'}, {v:'Ngày bắt đầu', e:'start date'}]) },
      { id: 'vi-i-15', language: 'vietnamese', level: 'intermediate', title: '📚 Books & Literature', phrases: JSON.stringify([{v:'Đọc sách', e:'read a book'}, {v:'Tiểu thuyết', e:'novel'}, {v:'Tác giả', e:'author'}, {v:'Thư viện', e:'library'}, {v:'Bìa sách', e:'book cover'}]) },
      { id: 'vi-i-16', language: 'vietnamese', level: 'intermediate', title: '🎨 Art & Culture', phrases: JSON.stringify([{v:'Bảo tàng', e:'museum'}, {v:'Tranh vẽ', e:'painting'}, {v:'Điêu khắc', e:'sculpture'}, {v:'Nghệ thuật', e:'art'}, {v:'Giá trị văn hóa', e:'cultural value'}]) },
      { id: 'vi-i-17', language: 'vietnamese', level: 'intermediate', title: '🏠 Home Renovation', phrases: JSON.stringify([{v:'Sơn tường', e:'paint wall'}, {v:'Bàn ghế', e:'furniture'}, {v:'Thợ', e:'craftsman'}, {v:'Vật liệu xây dựng', e:'building materials'}, {v:'Thiết kế nhà', e:'house design'}]) },
      { id: 'vi-i-18', language: 'vietnamese', level: 'intermediate', title: '⚡ Technology & Internet', phrases: JSON.stringify([{v:'Máy tính', e:'computer'}, {v:'Phần mềm', e:'software'}, {v:'Mạng internet', e:'internet network'}, {v:'Email', e:'email'}, {v:'Ứng dụng di động', e:'mobile app'}]) },
      { id: 'vi-i-19', language: 'vietnamese', level: 'intermediate', title: '💔 Relationship Issues', phrases: JSON.stringify([{v:'Mối quan hệ', e:'relationship'}, {v:'Yêu nhau', e:'love each other'}, {v:'Chia tay', e:'break up'}, {v:'Cãi vã', e:'argue'}, {v:'Xin lỗi', e:'apologize'}]) },
      { id: 'vi-i-20', language: 'vietnamese', level: 'intermediate', title: '🌍 Cultural Exchange', phrases: JSON.stringify([{v:'Nước ngoài', e:'foreign country'}, {v:'Văn hóa khác nhau', e:'different culture'}, {v:'Tập quán', e:'custom/tradition'}, {v:'Ngôn ngữ', e:'language'}, {v:'Tôn trọng khác biệt', e:'respect differences'}]) },
      { id: 'vi-i-21', language: 'vietnamese', level: 'intermediate', title: '🚗 Driving & Cars', phrases: JSON.stringify([{v:'Lái xe', e:'drive'}, {v:'Bằng lái', e:'driving license'}, {v:'Xăng', e:'gasoline'}, {v:'Bảo hiểm', e:'insurance'}, {v:'Sửa xe', e:'car repair'}]) },
      { id: 'vi-i-22', language: 'vietnamese', level: 'intermediate', title: '🎓 University Life', phrases: JSON.stringify([{v:'Sinh viên', e:'student'}, {v:'Giáo viên', e:'teacher'}, {v:'Kỳ thi', e:'exam'}, {v:'Bài tập', e:'homework'}, {v:'Lớp học', e:'classroom'}]) },
      { id: 'vi-i-23', language: 'vietnamese', level: 'intermediate', title: '🎪 Festivals & Events', phrases: JSON.stringify([{v:'Lễ hội', e:'festival'}, {v:'Bắn pháo hoa', e:'fireworks'}, {v:'Mặc áo dài', e:'wear áo dài'}, {v:'Tham gia', e:'participate'}, {v:'Vui vẻ', e:'fun'}]) },
      { id: 'vi-i-24', language: 'vietnamese', level: 'intermediate', title: '🏥 Health & Medicine', phrases: JSON.stringify([{v:'Cúm', e:'flu'}, {v:'Vitamin', e:'vitamin'}, {v:'Chích ngừa', e:'vaccination'}, {v:'Sức khỏe', e:'health'}, {v:'Tập thể dục', e:'exercise'}]) },
      { id: 'vi-i-25', language: 'vietnamese', level: 'intermediate', title: '🌐 Internet & Social Media', phrases: JSON.stringify([{v:'Facebook', e:'Facebook'}, {v:'Instagram', e:'Instagram'}, {v:'Đăng bài', e:'post'}, {v:'Like', e:'like'}, {v:'Bình luận', e:'comment'}]) },
      { id: 'vi-i-26', language: 'vietnamese', level: 'intermediate', title: '🍕 International Food', phrases: JSON.stringify([{v:'Pizza', e:'pizza'}, {v:'Burger', e:'burger'}, {v:'Sushi', e:'sushi'}, {v:'Ý', e:'Italy'}, {v:'Nhà hàng', e:'restaurant'}]) },
      { id: 'vi-i-27', language: 'vietnamese', level: 'intermediate', title: '🏖️ Beach & Water Activities', phrases: JSON.stringify([{v:'Biển', e:'beach'}, {v:'Bơi lội', e:'swimming'}, {v:'Lặn biển', e:'diving'}, {v:'Cát', e:'sand'}, {v:'Sóng', e:'wave'}]) },
      { id: 'vi-i-28', language: 'vietnamese', level: 'intermediate', title: '🌤️ Weather Conversations', phrases: JSON.stringify([{v:'Hôm nay thời tiết đẹp', e:'Nice weather today'}, {v:'Sẽ mưa', e:'It will rain'}, {v:'Nóng quá', e:'Too hot'}, {v:'Lạnh lắm', e:'Very cold'}, {v:'Độ ẩm', e:'humidity'}]) },
      { id: 'vi-i-29', language: 'vietnamese', level: 'intermediate', title: '✍️ Writing & Correspondence', phrases: JSON.stringify([{v:'Thư', e:'letter'}, {v:'Email', e:'email'}, {v:'Viết tay', e:'handwriting'}, {v:'Chữ ký', e:'signature'}, {v:'Địa chỉ', e:'address'}]) },
      { id: 'vi-i-30', language: 'vietnamese', level: 'intermediate', title: '🎁 Gifts & Celebrations', phrases: JSON.stringify([{v:'Quà tặng', e:'gift'}, {v:'Bao lì xì', e:'lucky money envelope'}, {v:'Sinh nhật', e:'birthday'}, {v:'Kỷ niệm', e:'anniversary'}, {v:'Chúc mừng', e:'congratulations'}]) },
      
      // VIETNAMESE - EXPERT (30 lessons)
      { id: 'vi-e-1', language: 'vietnamese', level: 'expert', title: '🍺 Bar & Nightlife Vibes', phrases: JSON.stringify([{v:'Anh ơi, gọi cho tôi...', e:'Bartender, get me...'}, {v:'Cheers!', e:'Một, hai, ba dô!'}, {v:'Bạn xinh như tiên nữ', e:'You are beautiful like a fairy'}, {v:'Tôi say rồi', e:'I am drunk'}, {v:'Nhảy múa đi', e:"Let's dance!"}]) },
      { id: 'vi-e-2', language: 'vietnamese', level: 'expert', title: '❤️ Dating & Romance', phrases: JSON.stringify([{v:'Em thích anh', e:'I like you'}, {v:'Anh yêu em', e:'I love you'}, {v:'Đi hẹn hò với tôi', e:'Go on a date with me'}, {v:'Em đẹp lắm', e:'You are so beautiful'}, {v:'Tôi muốn ôm em', e:'I want to hug you'}]) },
      { id: 'vi-e-3', language: 'vietnamese', level: 'expert', title: '💼 Business & Professional', phrases: JSON.stringify([{v:'Tôi là chuyên gia về...', e:'I am an expert in...'}, {v:'Hợp tác được không?', e:'Can we collaborate?'}, {v:'Giá cả như thế nào?', e:'What is the pricing?'}, {v:'Thời hạn là bao lâu?', e:'What is the deadline?'}, {v:'Ký hợp đồng', e:'Sign the contract'}]) },
      { id: 'vi-e-4', language: 'vietnamese', level: 'expert', title: '✈️ Travel & Getting Around', phrases: JSON.stringify([{v:'Tôi muốn đi du lịch', e:'I want to travel'}, {v:'Khách sạn ở đâu?', e:'Where is the hotel?'}, {v:'Xe máy cho thuê', e:'Motorbike rental'}, {v:'Tôi bị mất hộ chiếu', e:'I lost my passport'}, {v:'Bạn nói được tiếng Anh không?', e:'Do you speak English?'}]) },
      { id: 'vi-e-5', language: 'vietnamese', level: 'expert', title: '🎭 Culture & Philosophy', phrases: JSON.stringify([{v:'Điều này có ý nghĩa gì?', e:'What does this mean?'}, {v:'Văn hóa Việt rất phong phú', e:'Vietnamese culture is very rich'}, {v:'Tôi rất thích Việt Nam', e:'I love Vietnam very much'}, {v:'Bạn tin vào gì?', e:'What do you believe in?'}, {v:'Hành phúc là gì?', e:'What is happiness?'}]) },
      { id: 'vi-e-6', language: 'vietnamese', level: 'expert', title: '📊 Finance & Investment', phrases: JSON.stringify([{v:'Chứng khoán', e:'stocks'}, {v:'Đầu tư', e:'investment'}, {v:'Lợi nhuận', e:'profit'}, {v:'Rủi ro', e:'risk'}, {v:'Tài chính', e:'finance'}]) },
      { id: 'vi-e-7', language: 'vietnamese', level: 'expert', title: '🔬 Science & Technology', phrases: JSON.stringify([{v:'Khoa học', e:'science'}, {v:'AI', e:'artificial intelligence'}, {v:'Công nghệ', e:'technology'}, {v:'Máy móc', e:'machinery'}, {v:'Thí nghiệm', e:'experiment'}]) },
      { id: 'vi-e-8', language: 'vietnamese', level: 'expert', title: '⚖️ Law & Rights', phrases: JSON.stringify([{v:'Luật pháp', e:'law'}, {v:'Quyền', e:'rights'}, {v:'Công bằng', e:'justice'}, {v:'Tòa án', e:'court'}, {v:'Hợp pháp', e:'legal'}]) },
      { id: 'vi-e-9', language: 'vietnamese', level: 'expert', title: '🌍 Politics & Government', phrases: JSON.stringify([{v:'Chính phủ', e:'government'}, {v:'Bầu cử', e:'election'}, {v:'Chính sách', e:'policy'}, {v:'Công dân', e:'citizen'}, {v:'Quốc gia', e:'nation'}]) },
      { id: 'vi-e-10', language: 'vietnamese', level: 'expert', title: '📖 Literature & Poetry', phrases: JSON.stringify([{v:'Thơ', e:'poetry'}, {v:'Nhà thơ', e:'poet'}, {v:'Tác phẩm', e:'literary work'}, {v:'Thể loại', e:'genre'}, {v:'Ý nghĩa sâu sắc', e:'deep meaning'}]) },
      { id: 'vi-e-11', language: 'vietnamese', level: 'expert', title: '🏛️ Architecture & Design', phrases: JSON.stringify([{v:'Kiến trúc', e:'architecture'}, {v:'Thiết kế', e:'design'}, {v:'Tòa nhà', e:'building'}, {v:'Chiều cao', e:'height'}, {v:'Thẩm mỹ', e:'aesthetics'}]) },
      { id: 'vi-e-12', language: 'vietnamese', level: 'expert', title: '🌱 Environment & Climate', phrases: JSON.stringify([{v:'Môi trường', e:'environment'}, {v:'Biến đổi khí hậu', e:'climate change'}, {v:'Tái chế', e:'recycle'}, {v:'Carbon', e:'carbon'}, {v:'Xanh sạch', e:'green/clean'}]) },
      { id: 'vi-e-13', language: 'vietnamese', level: 'expert', title: '💎 Luxury & High-End Living', phrases: JSON.stringify([{v:'Sang trọng', e:'luxury'}, {v:'Hạng sang', e:'premium'}, {v:'Thiêu sơn tồn tại', e:'exclusive'}, {v:'Giá trị cao', e:'high value'}, {v:'Tinh tế', e:'refined'}]) },
      { id: 'vi-e-14', language: 'vietnamese', level: 'expert', title: '🎬 Film & Directing', phrases: JSON.stringify([{v:'Đạo diễn', e:'director'}, {v:'Kịch bản', e:'screenplay'}, {v:'Sản xuất', e:'production'}, {v:'Bối cảnh', e:'setting'}, {v:'Cảnh quay', e:'shot/scene'}]) },
      { id: 'vi-e-15', language: 'vietnamese', level: 'expert', title: '🎼 Music Theory & Composition', phrases: JSON.stringify([{v:'Soạn nhạc', e:'compose'}, {v:'Nhạc lý', e:'music theory'}, {v:'Giai điệu', e:'melody'}, {v:'Hòa âm', e:'harmony'}, {v:'Phiên bản', e:'arrangement'}]) },
      { id: 'vi-e-16', language: 'vietnamese', level: 'expert', title: '⚽ Professional Sports', phrases: JSON.stringify([{v:'Vô địch', e:'champion'}, {v:'Giải đấu', e:'tournament'}, {v:'Huấn luyện', e:'coaching'}, {v:'Kỹ thuật', e:'technique'}, {v:'Sân vận động', e:'stadium'}]) },
      { id: 'vi-e-17', language: 'vietnamese', level: 'expert', title: '👨‍⚕️ Advanced Medicine', phrases: JSON.stringify([{v:'Phẫu thuật', e:'surgery'}, {v:'Bệnh học', e:'pathology'}, {v:'Chẩn đoán', e:'diagnosis'}, {v:'Điều trị', e:'treatment'}, {v:'Liệu pháp', e:'therapy'}]) },
      { id: 'vi-e-18', language: 'vietnamese', level: 'expert', title: '🔮 Philosophy & Wisdom', phrases: JSON.stringify([{v:'Triết học', e:'philosophy'}, {v:'Ý thức', e:'consciousness'}, {v:'Bản chất', e:'essence'}, {v:'Nhân sinh quan', e:'life philosophy'}, {v:'Đạo đức', e:'ethics'}]) },
      { id: 'vi-e-19', language: 'vietnamese', level: 'expert', title: '🌐 Diplomacy & International Relations', phrases: JSON.stringify([{v:'Ngoại giao', e:'diplomacy'}, {v:'Đại sứ', e:'ambassador'}, {v:'Hiệp ước', e:'treaty'}, {v:'Quan hệ quốc tế', e:'international relations'}, {v:'Hợp tác', e:'cooperation'}]) },
      { id: 'vi-e-20', language: 'vietnamese', level: 'expert', title: '💍 Marriage & Family Law', phrases: JSON.stringify([{v:'Hôn nhân', e:'marriage'}, {v:'Ly hôn', e:'divorce'}, {v:'Tài sản chung', e:'joint property'}, {v:'Nuôi dạy con', e:'raise children'}, {v:'Pháp luật gia đình', e:'family law'}]) },
      { id: 'vi-e-21', language: 'vietnamese', level: 'expert', title: '🚀 Space & Future Tech', phrases: JSON.stringify([{v:'Vũ trụ', e:'universe'}, {v:'Tàu vũ trụ', e:'spacecraft'}, {v:'Lỗ đen', e:'black hole'}, {v:'Năng lượng tái tạo', e:'renewable energy'}, {v:'Sự phát triển', e:'advancement'}]) },
      { id: 'vi-e-22', language: 'vietnamese', level: 'expert', title: '🏆 Achievement & Success', phrases: JSON.stringify([{v:'Thành công', e:'success'}, {v:'Giải thưởng', e:'award'}, {v:'Kỹ năng', e:'skill'}, {v:'Động lực', e:'motivation'}, {v:'Mục tiêu', e:'goal'}]) },
      { id: 'vi-e-23', language: 'vietnamese', level: 'expert', title: '🎨 Contemporary Art', phrases: JSON.stringify([{v:'Hiện đại', e:'contemporary'}, {v:'Tượng trưng', e:'symbolism'}, {v:'Chủ nghĩa', e:'ism/movement'}, {v:'Tác phẩm', e:'artwork'}, {v:'Cuộc triển lãm', e:'exhibition'}]) },
      { id: 'vi-e-24', language: 'vietnamese', level: 'expert', title: '🍷 Wine & Cuisine Connoisseurship', phrases: JSON.stringify([{v:'Rượu vang', e:'wine'}, {v:'Nho', e:'grape'}, {v:'Hương vị', e:'flavor'}, {v:'Tươi mát', e:'fresh'}, {v:'Kết hợp thức ăn', e:'food pairing'}]) },
      { id: 'vi-e-25', language: 'vietnamese', level: 'expert', title: '📚 Academic Discourse', phrases: JSON.stringify([{v:'Luận văn', e:'thesis'}, {v:'Nghiên cứu', e:'research'}, {v:'Phương pháp khoa học', e:'scientific method'}, {v:'Chứng minh', e:'proof'}, {v:'Lý thuyết', e:'theory'}]) },
      { id: 'vi-e-26', language: 'vietnamese', level: 'expert', title: '💰 Corporate Strategy', phrases: JSON.stringify([{v:'Chiến lược kinh doanh', e:'business strategy'}, {v:'Thị trường', e:'market'}, {v:'Cạnh tranh', e:'competition'}, {v:'Lợi suất', e:'yield'}, {v:'Tăng trưởng', e:'growth'}]) },
      { id: 'vi-e-27', language: 'vietnamese', level: 'expert', title: '🌟 Spiritual & Mindfulness', phrases: JSON.stringify([{v:'Tâm linh', e:'spirituality'}, {v:'Thiền', e:'meditation'}, {v:'Quán tưởng', e:'mindfulness'}, {v:'Nội tâm', e:'inner self'}, {v:'Cân bằng', e:'balance'}]) },
      { id: 'vi-e-28', language: 'vietnamese', level: 'expert', title: '🏖️ Luxury Travel & Tourism', phrases: JSON.stringify([{v:'Kỳ nghỉ cao cấp', e:'luxury vacation'}, {v:'Resort 5 sao', e:'5-star resort'}, {v:'Dịch vụ đặc biệt', e:'concierge'}, {v:'Du lịch sang trọng', e:'upscale travel'}, {v:'Trải nghiệm độc quyền', e:'exclusive experience'}]) },
      { id: 'vi-e-29', language: 'vietnamese', level: 'expert', title: '🎤 Public Speaking & Rhetoric', phrases: JSON.stringify([{v:'Thuyết trình', e:'presentation'}, {v:'Hùng biện', e:'eloquence'}, {v:'Thuyết phục', e:'persuasion'}, {v:'Phát biểu', e:'speech'}, {v:'Khán giả', e:'audience'}]) },
      { id: 'vi-e-30', language: 'vietnamese', level: 'expert', title: '🌐 Global Issues & Activism', phrases: JSON.stringify([{v:'Vấn đề toàn cầu', e:'global issues'}, {v:'Nhân quyền', e:'human rights'}, {v:'Bất công', e:'injustice'}, {v:'Hoạt động', e:'activism'}, {v:'Thay đổi xã hội', e:'social change'}]) },

      // VENEZUELAN SPANISH - BEGINNER (30 lessons)
      { id: 'es-b-1', language: 'venezuelan_spanish', level: 'beginner', title: '🎤 Saludos Urbanos', phrases: JSON.stringify([{s:'¿Qué más?', e:"what's up?"}, {s:'Qué tal?', e:'how are you?'}, {s:'¡Eso!', e:"that's it!"}, {s:'Dale, caramba', e:'okay, man'}, {s:'Adiós, tío', e:'bye, buddy'}]) },
      { id: 'es-b-2', language: 'venezuelan_spanish', level: 'beginner', title: '🍽️ Arepa & Food Talk', phrases: JSON.stringify([{s:'arepa', e:'traditional corn bread'}, {s:'rellena de queso', e:'filled with cheese'}, {s:'hallaca', e:'traditional dish'}, {s:'cachapa', e:'corn pancake'}, {s:'tiene hambre', e:'you are hungry'}]) },
      { id: 'es-b-3', language: 'venezuelan_spanish', level: 'beginner', title: '🔢 Números & Billetes', phrases: JSON.stringify([{s:'uno', e:'one'}, {s:'diez', e:'ten'}, {s:'cien', e:'one hundred'}, {s:'mil', e:'thousand'}, {s:'bolívar', e:'currency'}]) },
      { id: 'es-b-4', language: 'venezuelan_spanish', level: 'beginner', title: '🎉 Party & Slang', phrases: JSON.stringify([{s:'¡Chévere!', e:'awesome!'}, {s:'marico', e:'dude (friendly)'}, {s:'vaina', e:'thing'}, {s:'la fiesta', e:'the party'}, {s:'ponerse candela', e:'get wild'}]) },
      { id: 'es-b-5', language: 'venezuelan_spanish', level: 'beginner', title: '👨‍👩‍👧 Familia Venezolana', phrases: JSON.stringify([{s:'mi vieja', e:'my mom'}, {s:'mi viejo', e:'my dad'}, {s:'hermana', e:'sister'}, {s:'hermano', e:'brother'}, {s:'tía abuela', e:'great aunt'}]) },
      { id: 'es-b-6', language: 'venezuelan_spanish', level: 'beginner', title: '🦁 Animales Venezolanos', phrases: JSON.stringify([{s:'cocodrilo', e:'crocodile'}, {s:'jaguar', e:'jaguar'}, {s:'loro', e:'parrot'}, {s:'anaconda', e:'anaconda'}, {s:'iguana', e:'iguana'}]) },
      { id: 'es-b-7', language: 'venezuelan_spanish', level: 'beginner', title: '⛅ Clima y Naturaleza', phrases: JSON.stringify([{s:'calor', e:'hot'}, {s:'lluvia', e:'rain'}, {s:'río', e:'river'}, {s:'montaña', e:'mountain'}, {s:'playa', e:'beach'}]) },
      { id: 'es-b-8', language: 'venezuelan_spanish', level: 'beginner', title: '👕 Ropa y Moda', phrases: JSON.stringify([{s:'camisa', e:'shirt'}, {s:'pantalón', e:'pants'}, {s:'zapatos', e:'shoes'}, {s:'gorra', e:'cap'}, {s:'hermoso', e:'beautiful'}]) },
      { id: 'es-b-9', language: 'venezuelan_spanish', level: 'beginner', title: '😊 Emociones Básicas', phrases: JSON.stringify([{s:'feliz', e:'happy'}, {s:'triste', e:'sad'}, {s:'enojado', e:'angry'}, {s:'miedo', e:'afraid'}, {s:'cansado', e:'tired'}]) },
      { id: 'es-b-10', language: 'venezuelan_spanish', level: 'beginner', title: '⏰ Tiempo y Días', phrases: JSON.stringify([{s:'hoy', e:'today'}, {s:'mañana', e:'tomorrow'}, {s:'ayer', e:'yesterday'}, {s:'semana', e:'week'}, {s:'mes', e:'month'}]) },
      { id: 'es-b-11', language: 'venezuelan_spanish', level: 'beginner', title: '🏠 Casa y Hogar', phrases: JSON.stringify([{s:'casa', e:'house'}, {s:'cuarto', e:'room'}, {s:'cocina', e:'kitchen'}, {s:'baño', e:'bathroom'}, {s:'puerta', e:'door'}]) },
      { id: 'es-b-12', language: 'venezuelan_spanish', level: 'beginner', title: '👤 Partes del Cuerpo', phrases: JSON.stringify([{s:'cabeza', e:'head'}, {s:'mano', e:'hand'}, {s:'pie', e:'foot'}, {s:'ojo', e:'eye'}, {s:'oído', e:'ear'}]) },
      { id: 'es-b-13', language: 'venezuelan_spanish', level: 'beginner', title: '⚽ Deportes y Juegos', phrases: JSON.stringify([{s:'fútbol', e:'football'}, {s:'natación', e:'swimming'}, {s:'corrida', e:'running'}, {s:'jugar', e:'play'}, {s:'ganar', e:'win'}]) },
      { id: 'es-b-14', language: 'venezuelan_spanish', level: 'beginner', title: '🌍 Países y Nacionalidades', phrases: JSON.stringify([{s:'Venezuela', e:'Venezuela'}, {s:'venezolano', e:'Venezuelan'}, {s:'Estados Unidos', e:'USA'}, {s:'España', e:'Spain'}, {s:'México', e:'Mexico'}]) },
      { id: 'es-b-15', language: 'venezuelan_spanish', level: 'beginner', title: '📚 Escuela y Educación', phrases: JSON.stringify([{s:'estudiar', e:'study'}, {s:'libro', e:'book'}, {s:'bolígrafo', e:'pen'}, {s:'clase', e:'class'}, {s:'maestro', e:'teacher'}]) },
      { id: 'es-b-16', language: 'venezuelan_spanish', level: 'beginner', title: '🚗 Transporte', phrases: JSON.stringify([{s:'carro', e:'car'}, {s:'avión', e:'airplane'}, {s:'tren', e:'train'}, {s:'autobús', e:'bus'}, {s:'ir', e:'go'}]) },
      { id: 'es-b-17', language: 'venezuelan_spanish', level: 'beginner', title: '🏪 Compras Básicas', phrases: JSON.stringify([{s:'comprar', e:'buy'}, {s:'vender', e:'sell'}, {s:'precio', e:'price'}, {s:'tienda', e:'shop'}, {s:'dinero', e:'money'}]) },
      { id: 'es-b-18', language: 'venezuelan_spanish', level: 'beginner', title: '🍎 Frutas y Vegetales', phrases: JSON.stringify([{s:'manzana', e:'apple'}, {s:'plátano', e:'banana'}, {s:'pepino', e:'cucumber'}, {s:'zanahoria', e:'carrot'}, {s:'naranja', e:'orange'}]) },
      { id: 'es-b-19', language: 'venezuelan_spanish', level: 'beginner', title: '📖 Lectura y Escritura', phrases: JSON.stringify([{s:'leer', e:'read'}, {s:'escribir', e:'write'}, {s:'letra', e:'letter'}, {s:'palabra', e:'word'}, {s:'oración', e:'sentence'}]) },
      { id: 'es-b-20', language: 'venezuelan_spanish', level: 'beginner', title: '🎵 Música Venezolana', phrases: JSON.stringify([{s:'música', e:'music'}, {s:'canción', e:'song'}, {s:'bailar', e:'dance'}, {s:'guitarra', e:'guitar'}, {s:'tambor', e:'drum'}]) },
      { id: 'es-b-21', language: 'venezuelan_spanish', level: 'beginner', title: '📱 Tecnología Básica', phrases: JSON.stringify([{s:'teléfono', e:'phone'}, {s:'computadora', e:'computer'}, {s:'internet', e:'internet'}, {s:'aplicación', e:'app'}, {s:'llamar', e:'call'}]) },
      { id: 'es-b-22', language: 'venezuelan_spanish', level: 'beginner', title: '💪 Salud y Ejercicio', phrases: JSON.stringify([{s:'saludable', e:'healthy'}, {s:'dolor', e:'pain'}, {s:'ejercicio', e:'exercise'}, {s:'dormir', e:'sleep'}, {s:'comer', e:'eat'}]) },
      { id: 'es-b-23', language: 'venezuelan_spanish', level: 'beginner', title: '👔 Profesiones', phrases: JSON.stringify([{s:'doctor', e:'doctor'}, {s:'maestro', e:'teacher'}, {s:'ingeniero', e:'engineer'}, {s:'obrero', e:'worker'}, {s:'granjero', e:'farmer'}]) },
      { id: 'es-b-24', language: 'venezuelan_spanish', level: 'beginner', title: '💰 Dinero y Banco', phrases: JSON.stringify([{s:'dinero', e:'money'}, {s:'banco', e:'bank'}, {s:'tarjeta', e:'card'}, {s:'efectivo', e:'cash'}, {s:'precio', e:'price'}]) },
      { id: 'es-b-25', language: 'venezuelan_spanish', level: 'beginner', title: '🎊 Celebraciones', phrases: JSON.stringify([{s:'Navidad', e:'Christmas'}, {s:'cumpleaños', e:'birthday'}, {s:'fiesta', e:'party'}, {s:'regalo', e:'gift'}, {s:'velas', e:'candles'}]) },
      { id: 'es-b-26', language: 'venezuelan_spanish', level: 'beginner', title: '🌳 Naturaleza', phrases: JSON.stringify([{s:'árbol', e:'tree'}, {s:'flor', e:'flower'}, {s:'agua', e:'water'}, {s:'tierra', e:'soil'}, {s:'bosque', e:'forest'}]) },
      { id: 'es-b-27', language: 'venezuelan_spanish', level: 'beginner', title: '⚡ Acciones y Verbos', phrases: JSON.stringify([{s:'estar de pie', e:'stand'}, {s:'sentar', e:'sit'}, {s:'correr', e:'run'}, {s:'caminar', e:'walk'}, {s:'acostarse', e:'lie down'}]) },
      { id: 'es-b-28', language: 'venezuelan_spanish', level: 'beginner', title: '🍴 Comidas y Modales', phrases: JSON.stringify([{s:'comer arroz', e:'eat rice'}, {s:'beber agua', e:'drink water'}, {s:'tenedor', e:'fork'}, {s:'plato', e:'plate'}, {s:'cuchara', e:'spoon'}]) },
      { id: 'es-b-29', language: 'venezuelan_spanish', level: 'beginner', title: '👫 Amigos y Relaciones', phrases: JSON.stringify([{s:'amigo', e:'friend'}, {s:'cercano', e:'close'}, {s:'amar', e:'love'}, {s:'encontrarse', e:'meet'}, {s:'hablar', e:'talk'}]) },
      { id: 'es-b-30', language: 'venezuelan_spanish', level: 'beginner', title: '🌙 Noche y Atardecer', phrases: JSON.stringify([{s:'noche', e:'night'}, {s:'oscuro', e:'dark'}, {s:'estrella', e:'star'}, {s:'luna', e:'moon'}, {s:'dormir', e:'sleep'}]) },

      // VENEZUELAN SPANISH - INTERMEDIATE (30 lessons)
      { id: 'es-i-1', language: 'venezuelan_spanish', level: 'intermediate', title: '💬 Conversación en la Calle', phrases: JSON.stringify([{s:'¿Qué fue de tu vida?', e:"What's been up?"}, {s:'Hace tiempo no te veía', e:"Haven't seen you in ages"}, {s:'Ando en la mía', e:'Just doing my thing'}, {s:'¿Cómo está la vaina?', e:"How's it going?"}, {s:'Eso está loco', e:'That is crazy'}]) },
      { id: 'es-i-2', language: 'venezuelan_spanish', level: 'intermediate', title: '💕 Ligar en el Bar', phrases: JSON.stringify([{s:'Eres muy bonita', e:'You are very pretty'}, {s:'Quiero bailar contigo', e:'I want to dance with you'}, {s:'¿Tienes novio?', e:'Do you have a boyfriend?'}, {s:'Me encantarías conocer', e:'I would love to know you'}, {s:'Dame tu número', e:'Give me your number'}]) },
      { id: 'es-i-3', language: 'venezuelan_spanish', level: 'intermediate', title: '🍷 En la Cantina', phrases: JSON.stringify([{s:'Ponme una cervecita', e:'Get me a beer'}, {s:'Brindemos', e:"Let's toast"}, {s:'¡Salud!', e:'Cheers!'}, {s:'Otro trago', e:'Another drink'}, {s:'La cuenta, porfa', e:'The check, please'}]) },
      { id: 'es-i-4', language: 'venezuelan_spanish', level: 'intermediate', title: '🛍️ De Compras', phrases: JSON.stringify([{s:'¿Cuánto cuesta?', e:'How much?'}, {s:'Está muy caro', e:'It is very expensive'}, {s:'Baja el precio', e:'Lower the price'}, {s:'Dame el descuento', e:'Give me the discount'}, {s:'No me alcanza', e:'I do not have enough money'}]) },
      { id: 'es-i-5', language: 'venezuelan_spanish', level: 'intermediate', title: '🚕 Pidiendo Taxi', phrases: JSON.stringify([{s:'¿Dónde está la parada de taxi?', e:'Where is the taxi stand?'}, {s:'Llévame a...', e:'Take me to...'}, {s:'¿Cuánto es el viaje?', e:'How much for the ride?'}, {s:'Tengo prisa', e:'I am in a hurry'}, {s:'Espérame aquí', e:'Wait for me here'}]) },
      { id: 'es-i-6', language: 'venezuelan_spanish', level: 'intermediate', title: '🏨 Hotel y Hospedaje', phrases: JSON.stringify([{s:'Quiero hacer una reserva', e:'I want to book a room'}, {s:'¿Habitación sencilla o doble?', e:'Single or double room?'}, {s:'¿Hay wifi?', e:'Is there wifi?'}, {s:'¿A qué hora es el check-out?', e:'What time is checkout?'}, {s:'La factura', e:'bill/invoice'}]) },
      { id: 'es-i-7', language: 'venezuelan_spanish', level: 'intermediate', title: '⚕️ Doctor y Hospital', phrases: JSON.stringify([{s:'Estoy enfermo', e:'I am sick'}, {s:'Me duele la cabeza', e:'I have a headache'}, {s:'Ir al doctor', e:'See a doctor'}, {s:'Receta', e:'Prescription'}, {s:'Hospital', e:'hospital'}]) },
      { id: 'es-i-8', language: 'venezuelan_spanish', level: 'intermediate', title: '🎬 Cine y Entretenimiento', phrases: JSON.stringify([{s:'Ver películas', e:'watch movie'}, {s:'Película buena', e:'good movie'}, {s:'Actor', e:'actor'}, {s:'Cine', e:'cinema'}, {s:'Entrada de cine', e:'movie ticket'}]) },
      { id: 'es-i-9', language: 'venezuelan_spanish', level: 'intermediate', title: '🎵 Conciertos y Música', phrases: JSON.stringify([{s:'Cantar karaoke', e:'sing karaoke'}, {s:'Concierto', e:'concert'}, {s:'Músico', e:'musician'}, {s:'Banda', e:'band'}, {s:'Amo esta canción', e:'Love this song'}]) },
      { id: 'es-i-10', language: 'venezuelan_spanish', level: 'intermediate', title: '⚽ Deportes y Actividades', phrases: JSON.stringify([{s:'Jugar fútbol', e:'play football'}, {s:'Natación', e:'swimming'}, {s:'Correr', e:'jogging'}, {s:'Senderismo', e:'hiking'}, {s:'Competencia deportiva', e:'sports competition'}]) },
      { id: 'es-i-11', language: 'venezuelan_spanish', level: 'intermediate', title: '📞 Llamadas Telefónicas', phrases: JSON.stringify([{s:'¿Aló?', e:'Hello?'}, {s:'¿Quién eres?', e:'Who are you?'}, {s:'Transfiere a...', e:'Transfer me to...'}, {s:'Llama después', e:'Call back later'}, {s:'Mala señal', e:'Bad signal'}]) },
      { id: 'es-i-12', language: 'venezuelan_spanish', level: 'intermediate', title: '✈️ Planificación de Viajes', phrases: JSON.stringify([{s:'Boleto de avión', e:'flight ticket'}, {s:'Pasaporte', e:'passport'}, {s:'Visa', e:'visa'}, {s:'Turismo', e:'tourism'}, {s:'Mapa', e:'map'}]) },
      { id: 'es-i-13', language: 'venezuelan_spanish', level: 'intermediate', title: '🍽️ Cocina y Recetas', phrases: JSON.stringify([{s:'Cocinar', e:'cook'}, {s:'Receta', e:'recipe'}, {s:'Hornear', e:'bake'}, {s:'Freír', e:'stir-fry'}, {s:'Condimentar', e:'season'}]) },
      { id: 'es-i-14', language: 'venezuelan_spanish', level: 'intermediate', title: '💼 Entrevista de Trabajo', phrases: JSON.stringify([{s:'Puesto de trabajo', e:'job position'}, {s:'Experiencia laboral', e:'work experience'}, {s:'Salario', e:'salary'}, {s:'Contrato', e:'contract'}, {s:'Fecha de inicio', e:'start date'}]) },
      { id: 'es-i-15', language: 'venezuelan_spanish', level: 'intermediate', title: '📚 Libros y Literatura', phrases: JSON.stringify([{s:'Leer un libro', e:'read a book'}, {s:'Novela', e:'novel'}, {s:'Autor', e:'author'}, {s:'Biblioteca', e:'library'}, {s:'Portada', e:'book cover'}]) },
      { id: 'es-i-16', language: 'venezuelan_spanish', level: 'intermediate', title: '🎨 Arte y Cultura', phrases: JSON.stringify([{s:'Museo', e:'museum'}, {s:'Cuadro', e:'painting'}, {s:'Escultura', e:'sculpture'}, {s:'Arte', e:'art'}, {s:'Valor cultural', e:'cultural value'}]) },
      { id: 'es-i-17', language: 'venezuelan_spanish', level: 'intermediate', title: '🏠 Renovación del Hogar', phrases: JSON.stringify([{s:'Pintar la pared', e:'paint wall'}, {s:'Muebles', e:'furniture'}, {s:'Carpintero', e:'craftsman'}, {s:'Materiales de construcción', e:'building materials'}, {s:'Diseño de casa', e:'house design'}]) },
      { id: 'es-i-18', language: 'venezuelan_spanish', level: 'intermediate', title: '⚡ Tecnología e Internet', phrases: JSON.stringify([{s:'Computadora', e:'computer'}, {s:'Software', e:'software'}, {s:'Red de internet', e:'internet network'}, {s:'Email', e:'email'}, {s:'Aplicación móvil', e:'mobile app'}]) },
      { id: 'es-i-19', language: 'venezuelan_spanish', level: 'intermediate', title: '💔 Problemas de Relación', phrases: JSON.stringify([{s:'Relación', e:'relationship'}, {s:'Amarse', e:'love each other'}, {s:'Separarse', e:'break up'}, {s:'Pelear', e:'argue'}, {s:'Disculpar', e:'apologize'}]) },
      { id: 'es-i-20', language: 'venezuelan_spanish', level: 'intermediate', title: '🌍 Intercambio Cultural', phrases: JSON.stringify([{s:'Extranjero', e:'foreign country'}, {s:'Culturas diferentes', e:'different culture'}, {s:'Costumbre', e:'custom/tradition'}, {s:'Idioma', e:'language'}, {s:'Respetar diferencias', e:'respect differences'}]) },
      { id: 'es-i-21', language: 'venezuelan_spanish', level: 'intermediate', title: '🚗 Conducción y Autos', phrases: JSON.stringify([{s:'Conducir', e:'drive'}, {s:'Licencia de conducir', e:'driving license'}, {s:'Gasolina', e:'gasoline'}, {s:'Seguro', e:'insurance'}, {s:'Reparar carro', e:'car repair'}]) },
      { id: 'es-i-22', language: 'venezuelan_spanish', level: 'intermediate', title: '🎓 Vida Universitaria', phrases: JSON.stringify([{s:'Estudiante', e:'student'}, {s:'Profesor', e:'teacher'}, {s:'Examen', e:'exam'}, {s:'Tarea', e:'homework'}, {s:'Aula', e:'classroom'}]) },
      { id: 'es-i-23', language: 'venezuelan_spanish', level: 'intermediate', title: '🎪 Festivales y Eventos', phrases: JSON.stringify([{s:'Festival', e:'festival'}, {s:'Fuegos artificiales', e:'fireworks'}, {s:'Usar traje tradicional', e:'wear traditional clothes'}, {s:'Participar', e:'participate'}, {s:'Diversión', e:'fun'}]) },
      { id: 'es-i-24', language: 'venezuelan_spanish', level: 'intermediate', title: '🏥 Salud y Medicina', phrases: JSON.stringify([{s:'Gripe', e:'flu'}, {s:'Vitamina', e:'vitamin'}, {s:'Vacunación', e:'vaccination'}, {s:'Salud', e:'health'}, {s:'Ejercitarse', e:'exercise'}]) },
      { id: 'es-i-25', language: 'venezuelan_spanish', level: 'intermediate', title: '🌐 Internet y Redes Sociales', phrases: JSON.stringify([{s:'Facebook', e:'Facebook'}, {s:'Instagram', e:'Instagram'}, {s:'Publicar', e:'post'}, {s:'Me gusta', e:'like'}, {s:'Comentario', e:'comment'}]) },
      { id: 'es-i-26', language: 'venezuelan_spanish', level: 'intermediate', title: '🍕 Comida Internacional', phrases: JSON.stringify([{s:'Pizza', e:'pizza'}, {s:'Hamburguesa', e:'burger'}, {s:'Sushi', e:'sushi'}, {s:'Italia', e:'Italy'}, {s:'Restaurante', e:'restaurant'}]) },
      { id: 'es-i-27', language: 'venezuelan_spanish', level: 'intermediate', title: '🏖️ Playa y Actividades Acuáticas', phrases: JSON.stringify([{s:'Playa', e:'beach'}, {s:'Nadar', e:'swimming'}, {s:'Buceo', e:'diving'}, {s:'Arena', e:'sand'}, {s:'Onda', e:'wave'}]) },
      { id: 'es-i-28', language: 'venezuelan_spanish', level: 'intermediate', title: '🌤️ Conversaciones sobre el Clima', phrases: JSON.stringify([{s:'Hoy hace buen tiempo', e:'Nice weather today'}, {s:'Va a llover', e:'It will rain'}, {s:'Mucho calor', e:'Too hot'}, {s:'Muy frío', e:'Very cold'}, {s:'Humedad', e:'humidity'}]) },
      { id: 'es-i-29', language: 'venezuelan_spanish', level: 'intermediate', title: '✍️ Escritura y Correspondencia', phrases: JSON.stringify([{s:'Carta', e:'letter'}, {s:'Email', e:'email'}, {s:'Escritura a mano', e:'handwriting'}, {s:'Firma', e:'signature'}, {s:'Dirección', e:'address'}]) },
      { id: 'es-i-30', language: 'venezuelan_spanish', level: 'intermediate', title: '🎁 Regalos y Celebraciones', phrases: JSON.stringify([{s:'Regalo', e:'gift'}, {s:'Dinero de la suerte', e:'lucky money envelope'}, {s:'Cumpleaños', e:'birthday'}, {s:'Aniversario', e:'anniversary'}, {s:'Felicitaciones', e:'congratulations'}]) },

      // VENEZUELAN SPANISH - EXPERT (30 lessons)
      { id: 'es-e-1', language: 'venezuelan_spanish', level: 'expert', title: '🎭 El Arte de Ligar', phrases: JSON.stringify([{s:'Eres preciosa de verdad', e:'You are truly precious'}, {s:'Quiero pasar la noche contigo', e:'I want to spend the night with you'}, {s:'Eres lo más bonito que he visto', e:'You are the most beautiful thing I have seen'}, {s:'Me estás volviendo loco', e:'You are driving me crazy'}, {s:'Te amo', e:'I love you'}]) },
      { id: 'es-e-2', language: 'venezuelan_spanish', level: 'expert', title: '🍺 Vida Nocturna Extrema', phrases: JSON.stringify([{s:'Vámonos a la discoteca', e:"Let's go to the nightclub"}, {s:'La música está candela', e:'The music is fire'}, {s:'Todos están emborrachados', e:'Everyone is drunk'}, {s:'¡Dale, que se prendió la vaina!', e:'Go, let the party begin!'}, {s:'Amanecimos en la juerga', e:'We stayed partying until sunrise'}]) },
      { id: 'es-e-3', language: 'venezuelan_spanish', level: 'expert', title: '💼 Negocios & Dinero', phrases: JSON.stringify([{s:'Necesito un préstamo urgente', e:'I need an urgent loan'}, {s:'Los precios están por las nubes', e:'Prices are sky high'}, {s:'Hay que meter la mano', e:'You have to participate/invest'}, {s:'Es un negociazo', e:'It is a great deal'}, {s:'Vamos a hacer un arreglo', e:"Let's make a deal"}]) },
      { id: 'es-e-4', language: 'venezuelan_spanish', level: 'expert', title: '✈️ Viajando por el Mundo', phrases: JSON.stringify([{s:'¿De cuál país eres?', e:'What country are you from?'}, {s:'Venezuela es muy linda', e:'Venezuela is very beautiful'}, {s:'He viajado a muchos lugares', e:'I have traveled to many places'}, {s:'La comida de acá es deliciosa', e:'The food here is delicious'}, {s:'Quiero conocer tu país', e:'I want to visit your country'}]) },
      { id: 'es-e-5', language: 'venezuelan_spanish', level: 'expert', title: '🎤 Charla Profunda', phrases: JSON.stringify([{s:'¿En qué crees?', e:'What do you believe in?'}, {s:'La vida es una vaina bien difícil', e:'Life is really difficult'}, {s:'Tenemos que tener esperanza', e:'We have to have hope'}, {s:'¿Cuáles son tus sueños?', e:'What are your dreams?'}, {s:'Yo quiero vivir bien', e:'I want to live well'}]) },
      { id: 'es-e-6', language: 'venezuelan_spanish', level: 'expert', title: '📊 Finanzas e Inversiones', phrases: JSON.stringify([{s:'Bolsa de valores', e:'stocks'}, {s:'Invertir', e:'investment'}, {s:'Ganancia', e:'profit'}, {s:'Riesgo', e:'risk'}, {s:'Finanzas', e:'finance'}]) },
      { id: 'es-e-7', language: 'venezuelan_spanish', level: 'expert', title: '🔬 Ciencia y Tecnología', phrases: JSON.stringify([{s:'Ciencia', e:'science'}, {s:'IA', e:'artificial intelligence'}, {s:'Tecnología', e:'technology'}, {s:'Máquinas', e:'machinery'}, {s:'Experimento', e:'experiment'}]) },
      { id: 'es-e-8', language: 'venezuelan_spanish', level: 'expert', title: '⚖️ Derecho y Derechos', phrases: JSON.stringify([{s:'Ley', e:'law'}, {s:'Derechos', e:'rights'}, {s:'Justicia', e:'justice'}, {s:'Tribunal', e:'court'}, {s:'Legal', e:'legal'}]) },
      { id: 'es-e-9', language: 'venezuelan_spanish', level: 'expert', title: '🌍 Política y Gobierno', phrases: JSON.stringify([{s:'Gobierno', e:'government'}, {s:'Elecciones', e:'election'}, {s:'Política', e:'policy'}, {s:'Ciudadano', e:'citizen'}, {s:'Nación', e:'nation'}]) },
      { id: 'es-e-10', language: 'venezuelan_spanish', level: 'expert', title: '📖 Literatura y Poesía', phrases: JSON.stringify([{s:'Poesía', e:'poetry'}, {s:'Poeta', e:'poet'}, {s:'Obra literaria', e:'literary work'}, {s:'Género', e:'genre'}, {s:'Significado profundo', e:'deep meaning'}]) },
      { id: 'es-e-11', language: 'venezuelan_spanish', level: 'expert', title: '🏛️ Arquitectura y Diseño', phrases: JSON.stringify([{s:'Arquitectura', e:'architecture'}, {s:'Diseño', e:'design'}, {s:'Edificio', e:'building'}, {s:'Altura', e:'height'}, {s:'Estética', e:'aesthetics'}]) },
      { id: 'es-e-12', language: 'venezuelan_spanish', level: 'expert', title: '🌱 Ambiente y Clima', phrases: JSON.stringify([{s:'Ambiente', e:'environment'}, {s:'Cambio climático', e:'climate change'}, {s:'Reciclar', e:'recycle'}, {s:'Carbono', e:'carbon'}, {s:'Verde y limpio', e:'green/clean'}]) },
      { id: 'es-e-13', language: 'venezuelan_spanish', level: 'expert', title: '💎 Lujo y Vida de Lujo', phrases: JSON.stringify([{s:'Lujo', e:'luxury'}, {s:'Clase premium', e:'premium'}, {s:'Exclusivo', e:'exclusive'}, {s:'Valor alto', e:'high value'}, {s:'Refinado', e:'refined'}]) },
      { id: 'es-e-14', language: 'venezuelan_spanish', level: 'expert', title: '🎬 Cine y Dirección', phrases: JSON.stringify([{s:'Director', e:'director'}, {s:'Guión', e:'screenplay'}, {s:'Producción', e:'production'}, {s:'Escena', e:'setting'}, {s:'Toma', e:'shot/scene'}]) },
      { id: 'es-e-15', language: 'venezuelan_spanish', level: 'expert', title: '🎼 Teoría y Composición Musical', phrases: JSON.stringify([{s:'Componer', e:'compose'}, {s:'Teoría musical', e:'music theory'}, {s:'Melodía', e:'melody'}, {s:'Armonía', e:'harmony'}, {s:'Arreglo', e:'arrangement'}]) },
      { id: 'es-e-16', language: 'venezuelan_spanish', level: 'expert', title: '⚽ Deportes Profesionales', phrases: JSON.stringify([{s:'Campeón', e:'champion'}, {s:'Torneo', e:'tournament'}, {s:'Entrenamiento', e:'coaching'}, {s:'Técnica', e:'technique'}, {s:'Estadio', e:'stadium'}]) },
      { id: 'es-e-17', language: 'venezuelan_spanish', level: 'expert', title: '👨‍⚕️ Medicina Avanzada', phrases: JSON.stringify([{s:'Cirugía', e:'surgery'}, {s:'Patología', e:'pathology'}, {s:'Diagnóstico', e:'diagnosis'}, {s:'Tratamiento', e:'treatment'}, {s:'Terapia', e:'therapy'}]) },
      { id: 'es-e-18', language: 'venezuelan_spanish', level: 'expert', title: '🔮 Filosofía y Sabiduría', phrases: JSON.stringify([{s:'Filosofía', e:'philosophy'}, {s:'Conciencia', e:'consciousness'}, {s:'Esencia', e:'essence'}, {s:'Filosofía de vida', e:'life philosophy'}, {s:'Ética', e:'ethics'}]) },
      { id: 'es-e-19', language: 'venezuelan_spanish', level: 'expert', title: '🌐 Diplomacia y Relaciones Internacionales', phrases: JSON.stringify([{s:'Diplomacia', e:'diplomacy'}, {s:'Embajador', e:'ambassador'}, {s:'Tratado', e:'treaty'}, {s:'Relaciones internacionales', e:'international relations'}, {s:'Cooperación', e:'cooperation'}]) },
      { id: 'es-e-20', language: 'venezuelan_spanish', level: 'expert', title: '💍 Matrimonio y Derecho de Familia', phrases: JSON.stringify([{s:'Matrimonio', e:'marriage'}, {s:'Divorcio', e:'divorce'}, {s:'Propiedad común', e:'joint property'}, {s:'Criar hijos', e:'raise children'}, {s:'Derecho de familia', e:'family law'}]) },
      { id: 'es-e-21', language: 'venezuelan_spanish', level: 'expert', title: '🚀 Espacio y Tecnología Futura', phrases: JSON.stringify([{s:'Universo', e:'universe'}, {s:'Nave espacial', e:'spacecraft'}, {s:'Agujero negro', e:'black hole'}, {s:'Energía renovable', e:'renewable energy'}, {s:'Avance', e:'advancement'}]) },
      { id: 'es-e-22', language: 'venezuelan_spanish', level: 'expert', title: '🏆 Logro y Éxito', phrases: JSON.stringify([{s:'Éxito', e:'success'}, {s:'Premio', e:'award'}, {s:'Habilidad', e:'skill'}, {s:'Motivación', e:'motivation'}, {s:'Meta', e:'goal'}]) },
      { id: 'es-e-23', language: 'venezuelan_spanish', level: 'expert', title: '🎨 Arte Contemporáneo', phrases: JSON.stringify([{s:'Contemporáneo', e:'contemporary'}, {s:'Simbolismo', e:'symbolism'}, {s:'Movimiento artístico', e:'ism/movement'}, {s:'Obra de arte', e:'artwork'}, {s:'Exhibición', e:'exhibition'}]) },
      { id: 'es-e-24', language: 'venezuelan_spanish', level: 'expert', title: '🍷 Vino y Gastronomía', phrases: JSON.stringify([{s:'Vino', e:'wine'}, {s:'Uva', e:'grape'}, {s:'Sabor', e:'flavor'}, {s:'Fresco', e:'fresh'}, {s:'Maridaje', e:'food pairing'}]) },
      { id: 'es-e-25', language: 'venezuelan_spanish', level: 'expert', title: '📚 Discurso Académico', phrases: JSON.stringify([{s:'Tesis', e:'thesis'}, {s:'Investigación', e:'research'}, {s:'Método científico', e:'scientific method'}, {s:'Prueba', e:'proof'}, {s:'Teoría', e:'theory'}]) },
      { id: 'es-e-26', language: 'venezuelan_spanish', level: 'expert', title: '💰 Estrategia Corporativa', phrases: JSON.stringify([{s:'Estrategia empresarial', e:'business strategy'}, {s:'Mercado', e:'market'}, {s:'Competencia', e:'competition'}, {s:'Rendimiento', e:'yield'}, {s:'Crecimiento', e:'growth'}]) },
      { id: 'es-e-27', language: 'venezuelan_spanish', level: 'expert', title: '🌟 Espiritualidad y Consciencia', phrases: JSON.stringify([{s:'Espiritualidad', e:'spirituality'}, {s:'Meditación', e:'meditation'}, {s:'Atención plena', e:'mindfulness'}, {s:'Ser interno', e:'inner self'}, {s:'Equilibrio', e:'balance'}]) },
      { id: 'es-e-28', language: 'venezuelan_spanish', level: 'expert', title: '🏖️ Turismo Lujo y Viajes', phrases: JSON.stringify([{s:'Vacaciones de lujo', e:'luxury vacation'}, {s:'Resort de 5 estrellas', e:'5-star resort'}, {s:'Conserje', e:'concierge'}, {s:'Viaje exclusivo', e:'upscale travel'}, {s:'Experiencia única', e:'exclusive experience'}]) },
      { id: 'es-e-29', language: 'venezuelan_spanish', level: 'expert', title: '🎤 Oratoria y Retórica', phrases: JSON.stringify([{s:'Presentación', e:'presentation'}, {s:'Elocuencia', e:'eloquence'}, {s:'Persuasión', e:'persuasion'}, {s:'Discurso', e:'speech'}, {s:'Audiencia', e:'audience'}]) },
      { id: 'es-e-30', language: 'venezuelan_spanish', level: 'expert', title: '🌐 Problemas Globales y Activismo', phrases: JSON.stringify([{s:'Problemas globales', e:'global issues'}, {s:'Derechos humanos', e:'human rights'}, {s:'Injusticia', e:'injustice'}, {s:'Activismo', e:'activism'}, {s:'Cambio social', e:'social change'}]) }
    ];
    
    const insertStmt = db.prepare('INSERT INTO lessons (id, language, level, title, phrases) VALUES (?, ?, ?, ?, ?)');
    for (const lesson of lessons) {
      insertStmt.run(lesson.id, lesson.language, lesson.level, lesson.title, lesson.phrases);
    }
  }

  // Seed flashcards if not already done
  const fcStmt = db.prepare('SELECT COUNT(*) as count FROM flashcards');
  if (fcStmt.get().count === 0) {
    const flashcards = [
      // Vietnamese Beginner
      { id: 'fc-vi-b-1-1', lesson_id: 'vi-b-1', front: 'hello', back: 'xin chào', audio_url: '/audio/vi-hello.mp3', language: 'vietnamese' },
      { id: 'fc-vi-b-1-2', lesson_id: 'vi-b-1', front: 'goodbye', back: 'tạm biệt', audio_url: '/audio/vi-goodbye.mp3', language: 'vietnamese' },
      { id: 'fc-vi-b-1-3', lesson_id: 'vi-b-1', front: 'thank you', back: 'cảm ơn', audio_url: '/audio/vi-thank.mp3', language: 'vietnamese' },
      { id: 'fc-vi-b-2-1', lesson_id: 'vi-b-2', front: 'one', back: 'một', audio_url: '/audio/vi-one.mp3', language: 'vietnamese' },
      { id: 'fc-vi-b-2-2', lesson_id: 'vi-b-2', front: 'five', back: 'năm', audio_url: '/audio/vi-five.mp3', language: 'vietnamese' },
      { id: 'fc-vi-b-2-3', lesson_id: 'vi-b-2', front: 'ten', back: 'mười', audio_url: '/audio/vi-ten.mp3', language: 'vietnamese' },
      { id: 'fc-vi-b-3-1', lesson_id: 'vi-b-3', front: 'pho soup', back: 'phở', audio_url: '/audio/vi-pho.mp3', language: 'vietnamese' },
      { id: 'fc-vi-b-3-2', lesson_id: 'vi-b-3', front: 'rice', back: 'cơm', audio_url: '/audio/vi-rice.mp3', language: 'vietnamese' },
      { id: 'fc-vi-b-4-1', lesson_id: 'vi-b-4', front: 'mother', back: 'mẹ', audio_url: '/audio/vi-mom.mp3', language: 'vietnamese' },
      { id: 'fc-vi-b-4-2', lesson_id: 'vi-b-4', front: 'father', back: 'bố', audio_url: '/audio/vi-dad.mp3', language: 'vietnamese' },
      
      // Vietnamese Intermediate
      { id: 'fc-vi-i-1-1', lesson_id: 'vi-i-1', front: 'How are you?', back: 'Bạn khỏe không?', audio_url: '/audio/vi-howareyou.mp3', language: 'vietnamese' },
      { id: 'fc-vi-i-1-2', lesson_id: 'vi-i-1', front: 'What is your name?', back: 'Bạn tên gì?', audio_url: '/audio/vi-name.mp3', language: 'vietnamese' },
      { id: 'fc-vi-i-2-1', lesson_id: 'vi-i-2', front: 'I want pho', back: 'Tôi muốn ăn phở', audio_url: '/audio/vi-wantpho.mp3', language: 'vietnamese' },
      { id: 'fc-vi-i-2-2', lesson_id: 'vi-i-2', front: 'Not spicy', back: 'Không cay', audio_url: '/audio/vi-notspicy.mp3', language: 'vietnamese' },
      { id: 'fc-vi-i-3-1', lesson_id: 'vi-i-3', front: 'You are beautiful', back: 'Bạn rất xinh!', audio_url: '/audio/vi-beautiful.mp3', language: 'vietnamese' },
      { id: 'fc-vi-i-3-2', lesson_id: 'vi-i-3', front: 'I want to know you', back: 'Tôi muốn biết bạn hơn', audio_url: '/audio/vi-knowyou.mp3', language: 'vietnamese' },
      { id: 'fc-vi-i-4-1', lesson_id: 'vi-i-4', front: 'How much?', back: 'Bao nhiêu tiền?', audio_url: '/audio/vi-howmuch.mp3', language: 'vietnamese' },
      { id: 'fc-vi-i-4-2', lesson_id: 'vi-i-4', front: 'Too expensive', back: 'Quá đắt!', audio_url: '/audio/vi-expensive.mp3', language: 'vietnamese' },
      { id: 'fc-vi-i-5-1', lesson_id: 'vi-i-5', front: 'Where is this?', back: 'Cái này ở đâu?', audio_url: '/audio/vi-where.mp3', language: 'vietnamese' },
      { id: 'fc-vi-i-5-2', lesson_id: 'vi-i-5', front: 'Turn right', back: 'Rẽ phải', audio_url: '/audio/vi-right.mp3', language: 'vietnamese' },
      
      // Vietnamese Expert
      { id: 'fc-vi-e-1-1', lesson_id: 'vi-e-1', front: 'Cheers!', back: 'Một, hai, ba dô!', audio_url: '/audio/vi-cheers.mp3', language: 'vietnamese' },
      { id: 'fc-vi-e-1-2', lesson_id: 'vi-e-1', front: "Let's dance!", back: 'Nhảy múa đi', audio_url: '/audio/vi-dance.mp3', language: 'vietnamese' },
      { id: 'fc-vi-e-2-1', lesson_id: 'vi-e-2', front: 'I love you', back: 'Anh yêu em', audio_url: '/audio/vi-ilove.mp3', language: 'vietnamese' },
      { id: 'fc-vi-e-2-2', lesson_id: 'vi-e-2', front: 'I want to hug you', back: 'Tôi muốn ôm em', audio_url: '/audio/vi-hug.mp3', language: 'vietnamese' },
      { id: 'fc-vi-e-3-1', lesson_id: 'vi-e-3', front: 'Can we collaborate?', back: 'Hợp tác được không?', audio_url: '/audio/vi-collaborate.mp3', language: 'vietnamese' },
      { id: 'fc-vi-e-4-1', lesson_id: 'vi-e-4', front: 'I lost my passport', back: 'Tôi bị mất hộ chiếu', audio_url: '/audio/vi-passport.mp3', language: 'vietnamese' },
      { id: 'fc-vi-e-5-1', lesson_id: 'vi-e-5', front: 'What is happiness?', back: 'Hành phúc là gì?', audio_url: '/audio/vi-happiness.mp3', language: 'vietnamese' },

      // Venezuelan Spanish Beginner
      { id: 'fc-es-b-1-1', lesson_id: 'es-b-1', front: "what's up", back: '¿Qué más?', audio_url: '/audio/es-whatsup.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-b-1-2', lesson_id: 'es-b-1', front: 'how are you', back: 'Qué tal?', audio_url: '/audio/es-howareyou.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-b-2-1', lesson_id: 'es-b-2', front: 'arepa', back: 'arepa', audio_url: '/audio/es-arepa.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-b-2-2', lesson_id: 'es-b-2', front: 'corn pancake', back: 'cachapa', audio_url: '/audio/es-cachapa.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-b-3-1', lesson_id: 'es-b-3', front: 'one', back: 'uno', audio_url: '/audio/es-one.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-b-3-2', lesson_id: 'es-b-3', front: 'ten', back: 'diez', audio_url: '/audio/es-ten.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-b-4-1', lesson_id: 'es-b-4', front: 'awesome', back: '¡Chévere!', audio_url: '/audio/es-chevere.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-b-4-2', lesson_id: 'es-b-4', front: 'the party', back: 'la fiesta', audio_url: '/audio/es-party.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-b-5-1', lesson_id: 'es-b-5', front: 'my mom', back: 'mi vieja', audio_url: '/audio/es-mom.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-b-5-2', lesson_id: 'es-b-5', front: 'my dad', back: 'mi viejo', audio_url: '/audio/es-dad.mp3', language: 'venezuelan_spanish' },

      // Venezuelan Spanish Intermediate
      { id: 'fc-es-i-1-1', lesson_id: 'es-i-1', front: 'What has been up?', back: '¿Qué fue de tu vida?', audio_url: '/audio/es-whatsup.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-i-1-2', lesson_id: 'es-i-1', front: 'That is crazy', back: 'Eso está loco', audio_url: '/audio/es-crazy.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-i-2-1', lesson_id: 'es-i-2', front: 'You are very pretty', back: 'Eres muy bonita', audio_url: '/audio/es-pretty.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-i-2-2', lesson_id: 'es-i-2', front: 'Do you have a boyfriend?', back: '¿Tienes novio?', audio_url: '/audio/es-boyfriend.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-i-3-1', lesson_id: 'es-i-3', front: 'Get me a beer', back: 'Ponme una cervecita', audio_url: '/audio/es-beer.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-i-3-2', lesson_id: 'es-i-3', front: 'Cheers!', back: '¡Salud!', audio_url: '/audio/es-salud.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-i-4-1', lesson_id: 'es-i-4', front: 'How much?', back: '¿Cuánto cuesta?', audio_url: '/audio/es-howmuch.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-i-4-2', lesson_id: 'es-i-4', front: 'Very expensive', back: 'Está muy caro', audio_url: '/audio/es-expensive.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-i-5-1', lesson_id: 'es-i-5', front: 'Take me to...', back: 'Llévame a...', audio_url: '/audio/es-takeme.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-i-5-2', lesson_id: 'es-i-5', front: 'I am in a hurry', back: 'Tengo prisa', audio_url: '/audio/es-hurry.mp3', language: 'venezuelan_spanish' },

      // Venezuelan Spanish Expert
      { id: 'fc-es-e-1-1', lesson_id: 'es-e-1', front: 'You are the most beautiful', back: 'Eres lo más bonito que he visto', audio_url: '/audio/es-mostbeautiful.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-e-1-2', lesson_id: 'es-e-1', front: 'I love you', back: 'Te amo', audio_url: '/audio/es-ilove.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-e-2-1', lesson_id: 'es-e-2', front: "Let's go to the nightclub", back: 'Vámonos a la discoteca', audio_url: '/audio/es-nightclub.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-e-2-2', lesson_id: 'es-e-2', front: 'The music is fire', back: 'La música está candela', audio_url: '/audio/es-musicfire.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-e-3-1', lesson_id: 'es-e-3', front: 'I need an urgent loan', back: 'Necesito un préstamo urgente', audio_url: '/audio/es-loan.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-e-3-2', lesson_id: 'es-e-3', front: "Let's make a deal", back: 'Vamos a hacer un arreglo', audio_url: '/audio/es-deal.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-e-4-1', lesson_id: 'es-e-4', front: 'What country are you from?', back: '¿De cuál país eres?', audio_url: '/audio/es-country.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-e-5-1', lesson_id: 'es-e-5', front: 'What do you believe in?', back: '¿En qué crees?', audio_url: '/audio/es-believe.mp3', language: 'venezuelan_spanish' },
      { id: 'fc-es-e-5-2', lesson_id: 'es-e-5', front: 'What are your dreams?', back: '¿Cuáles son tus sueños?', audio_url: '/audio/es-dreams.mp3', language: 'venezuelan_spanish' }
    ];
    const insertFC = db.prepare('INSERT INTO flashcards (id, lesson_id, front, back, audio_url, language) VALUES (?, ?, ?, ?, ?, ?)');
    for (const fc of flashcards) {
      insertFC.run(fc.id, fc.lesson_id, fc.front, fc.back, fc.audio_url, fc.language);
    }
  }
}

initializeDB();
seedLessons();

module.exports = db;
