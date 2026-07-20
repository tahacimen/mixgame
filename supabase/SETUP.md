# Supabase bağlantısı

MixGame, `config.js` boşken yerel demo modunda çalışır. Ortak veritabanı ve güvenli roller için:

1. Supabase Dashboard'da yeni bir proje oluştur.
2. SQL Editor'da `migrations/202607200001_init.sql` dosyasını çalıştır.
3. Authentication → Users bölümünde şu kullanıcıları oluştur ve otomatik onayla:
   - `oyuncu1@mixgame.local`
   - `oyuncu2@mixgame.local`
   - `oyuncu3@mixgame.local`
4. Kullanıcılar oluştuktan sonra SQL Editor'da aşağıdaki sorguyu çalıştır:

```sql
insert into public.profiles (id, username, display_name, role)
select id,
  split_part(email, '@', 1),
  case split_part(email, '@', 1)
    when 'oyuncu1' then 'Oyuncu 1'
    when 'oyuncu2' then 'Oyuncu 2'
    when 'oyuncu3' then 'Oyuncu 3'
  end,
  case split_part(email, '@', 1)
    when 'oyuncu1' then 'admin'
    when 'oyuncu3' then 'editor'
    else 'player'
  end
from auth.users
where email in ('oyuncu1@mixgame.local', 'oyuncu2@mixgame.local', 'oyuncu3@mixgame.local')
on conflict (id) do update
set username = excluded.username,
    display_name = excluded.display_name,
    role = excluded.role;
```

5. Edge Function'ı yayınla:

```sh
supabase functions deploy metadata
```

6. `config.js` içindeki herkese açık proje URL'si ve `anon`/publishable anahtarı alanlarını doldur:

```js
window.MIXGAME_CONFIG = {
  supabaseUrl: "https://PROJECT.supabase.co",
  supabaseAnonKey: "PUBLIC_ANON_KEY",
  metadataEndpoint: "https://PROJECT.supabase.co/functions/v1/metadata",
};
```

`service_role` anahtarını hiçbir zaman tarayıcı koduna, GitHub reposuna veya `config.js` dosyasına koyma.
