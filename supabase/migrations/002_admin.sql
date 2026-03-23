-- profiles에 role, approved 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- 기존 유저들 승인 처리 (이미 가입된 계정)
UPDATE profiles SET is_approved = true;

-- admin이 모든 profiles 조회 가능하도록 정책 추가
CREATE POLICY "admin 전체 조회" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- admin이 다른 유저 승인 가능하도록
CREATE POLICY "admin 승인 수정" ON profiles
  FOR UPDATE USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
