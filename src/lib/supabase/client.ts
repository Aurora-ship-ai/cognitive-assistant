import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a mock client when Supabase is not configured
    console.warn(
      "Supabase 未配置。请设置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY 环境变量。\n" +
      "用户登录和数据同步功能暂不可用，本地功能正常工作。"
    );
    // Create a minimal mock that won't crash the app
    supabaseClient = {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => {} } },
        }),
        signInWithPassword: () =>
          Promise.resolve({ data: { user: null, session: null }, error: new Error("Supabase 未配置") }),
        signUp: () =>
          Promise.resolve({ data: { user: null, session: null }, error: new Error("Supabase 未配置") }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => {
        throw new Error("Supabase 未配置，数据库操作不可用");
      },
      storage: {
        from: () => {
          throw new Error("Supabase 未配置，文件存储不可用");
        },
      },
    } as unknown as ReturnType<typeof createBrowserClient>;
    return supabaseClient;
  }

  supabaseClient = createBrowserClient(url, key);
  return supabaseClient;
}
