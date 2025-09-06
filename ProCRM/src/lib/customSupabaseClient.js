import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oimcvtqcipbufmwyhyix.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbWN2dHFjaXBidWZtd3loeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMDE5NTAsImV4cCI6MjA3MjY3Nzk1MH0.sWlbAs65jKl8I4CTG5pyluuTwuf-b8hY6qWjxQH2uKc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);