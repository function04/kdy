-- =============================================
-- 1. profiles 테이블
-- =============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  timezone TEXT DEFAULT 'Asia/Seoul',
  weather_city TEXT DEFAULT '인천',
  weather_lat FLOAT DEFAULT 37.45,
  weather_lon FLOAT DEFAULT 126.70,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 프로필만 조회" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "본인 프로필만 삽입" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "본인 프로필만 수정" ON profiles
  FOR UPDATE USING (auth.uid() = id);


-- =============================================
-- 2. activities 테이블
-- =============================================
CREATE TYPE activity_type AS ENUM ('wake', 'sleep', 'study', 'exercise');

CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type activity_type NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE WHEN ended_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER / 60
    END
  ) STORED,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 활동만 조회" ON activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "본인 활동만 삽입" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 활동만 수정" ON activities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "본인 활동만 삭제" ON activities
  FOR DELETE USING (auth.uid() = user_id);


-- =============================================
-- 3. memos 테이블
-- =============================================
CREATE TABLE memos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  scheduled_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE memos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 메모만 조회" ON memos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "본인 메모만 삽입" ON memos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 메모만 수정" ON memos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "본인 메모만 삭제" ON memos
  FOR DELETE USING (auth.uid() = user_id);


-- =============================================
-- 4. daily_summaries 테이블
-- =============================================
CREATE TABLE daily_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  wake_time TIME,
  sleep_time TIME,
  total_study_minutes INTEGER DEFAULT 0,
  total_exercise_minutes INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 요약만 조회" ON daily_summaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "본인 요약만 삽입" ON daily_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 요약만 수정" ON daily_summaries
  FOR UPDATE USING (auth.uid() = user_id);


-- =============================================
-- 5. username 중복 체크 함수
-- =============================================
CREATE OR REPLACE FUNCTION check_username_available(p_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM profiles WHERE username = p_username);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
