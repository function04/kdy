CREATE TABLE ddays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ddays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ddays_select" ON ddays FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ddays_insert" ON ddays FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ddays_update" ON ddays FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ddays_delete" ON ddays FOR DELETE USING (auth.uid() = user_id);
