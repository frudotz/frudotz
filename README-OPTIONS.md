# README seçenekleri: frudotz

Yalnızca önizleme taslaklarıdır; canlı profil README'si (`readme.md`) değişmedi. Her seçenek, [`assets/`](assets/) altındaki özgün, repoda barındırılan SVG görselleriyle tam bir görsel tasarımdır. **Ana sürümler Türkçe**; İngilizce sürümler aynı olguları taşıyan **yedeklerdir**.

<table>
  <tr>
    <td width="33%" valign="top">
      <a href="README-option-a-studio-tr.md"><img alt="Seçenek A önizlemesi: frudotz yazısı ve soyut turuncu, mavi, sarı kompozisyonlu afiş tarzı stüdyo başlığı." src="./assets/a-studio/hero-light-tr.svg" width="100%"></a>
      <h3><a href="README-option-a-studio-tr.md">A · Stüdyo</a></h3>
      <sub>Editoryal portfolyo · her proje için afiş kartı, temaya duyarlı başlık ve zaman çizelgesi · üçüncü taraf görsel yok</sub><br>
      <sub>🇹🇷 <a href="README-option-a-studio-tr.md"><b>Türkçe (ana)</b></a> · 🇬🇧 <a href="README-option-a-studio-en.md">English (yedek)</a></sub>
    </td>
    <td width="33%" valign="top">
      <a href="README-option-b-gece-vardiyasi-tr.md"><img alt="Seçenek B önizlemesi: terminal penceresi, GECE VARDİYASI başlığı ve neon dalga formu olan gece temalı başlık." src="./assets/b-gece/hero.svg" width="100%"></a>
      <h3><a href="README-option-b-gece-vardiyasi-tr.md">B · Gece Vardiyası</a></h3>
      <sub>Cyber-gece ve müzik · kaset setlist, mikser kanalları, NOCTERA plak kartı · üçüncü taraf görsel yok</sub><br>
      <sub>🇹🇷 <a href="README-option-b-gece-vardiyasi-tr.md"><b>Türkçe (ana)</b></a> · 🇬🇧 <a href="README-option-b-gece-vardiyasi-en.md">English (yedek, "Night Shift")</a></sub>
    </td>
    <td width="33%" valign="top">
      <a href="README-option-c-dashboard-tr.md"><img alt="Seçenek C önizlemesi: degrade monogram ve değişiklik paneli olan, uygulama penceresi biçiminde ürün tarzı başlık." src="./assets/c-dashboard/hero-light-tr.svg" width="100%"></a>
      <h3><a href="README-option-c-dashboard-tr.md">C · Dashboard</a></h3>
      <sub>Modern ürün paneli, iki dilli · bento özet, yayın panosu, canlı shields.io durum rozetleri, skillicons şeridi</sub><br>
      <sub>🇹🇷 <a href="README-option-c-dashboard-tr.md"><b>Türkçe öncelikli (ana)</b></a> · 🇬🇧 <a href="README-option-c-dashboard-en.md">English + Türkçe (yedek)</a></sub>
    </td>
  </tr>
</table>

## Dosyalar ve diller

| Seçenek | Türkçe (ana) | İngilizce (yedek) | Görseller |
| :-- | :-- | :-- | :-- |
| A · Stüdyo | [`README-option-a-studio-tr.md`](README-option-a-studio-tr.md) | [`README-option-a-studio-en.md`](README-option-a-studio-en.md) | `assets/a-studio/*-tr.svg` (TR) · `*.svg` (EN) |
| B · Gece Vardiyası | [`README-option-b-gece-vardiyasi-tr.md`](README-option-b-gece-vardiyasi-tr.md) | [`README-option-b-gece-vardiyasi-en.md`](README-option-b-gece-vardiyasi-en.md) | `assets/b-gece/*.svg` (TR) · `*-en.svg` (EN) · ayırıcı ortak |
| C · Dashboard | [`README-option-c-dashboard-tr.md`](README-option-c-dashboard-tr.md) (Türkçe üstte, kısa İngilizce özet katlanır bölümde) | [`README-option-c-dashboard-en.md`](README-option-c-dashboard-en.md) (İngilizce üstte, tam Türkçe katlanır bölümde) | `assets/c-dashboard/*-tr.svg` (TR) · `*.svg` (EN) |

Her dosyanın sağ üstünde dil geçiş bağlantısı var. Olgular ve `[[CONFIRM: ...]]` işaretleri her iki dilde aynıdır.

## Karşılaştırma

| | A · Stüdyo | B · Gece Vardiyası | C · Dashboard |
| :-- | :-- | :-- | :-- |
| Öne çıkan kimlik | Tasarım ve portfolyo | Siber güvenlik gecesi + müzik | Dengeli: tasarım, güvenlik, ağ, web |
| En iyi hedef kitle | Tasarım/ajans, yaratıcı roller | Topluluk, müzik çevresi, kişilik odaklı ziyaretçi | İşe alım yapanlar, teknik ekipler, karma kitle |
| Kanıt gösterimi | Proje kartları (bağlantılı) | Setlist + kaynak bağlantıları | Yayın panosu + canlı durum rozetleri + proje tablosu |
| Müziğe verdiği ağırlık | Düşük (bir kart + bir sütun) | Yüksek (ayrı "B tarafı") | Düşük (bir satır) |
| Açık/koyu tema | Başlık ve zaman çizelgesi `<picture>`; kartlar kendi renk bloğunda | Kendi koyu panelleri (temayla değişmez) | Her SVG için `<picture>` |
| Dış sunucular | Yok | Yok | shields.io, skillicons.dev (2026-11-15'te HTTP 200) |
| Hareket | Yok | İmleç + dalga, 5 sn'den kısa, "hareketi azalt" tercihinde kapalı | Yok |
| Bağımlı olduğu onaylar | Görünen ad, tasarım araçları | **NOCTERA rolü ve müzik katılımı** (konsept buna dayanıyor) | Görünen ad, kurum adı/unvan görünürlüğü |

### Öneri (karar senin)

Birden çok profesyonel kimliği (tasarım, yazılım, müzik, siber güvenlik) **en dengeli** taşıyan seçenek **C · Dashboard (Türkçe)** görünüyor: her alanı kanıta bağlı kısa bir karoyla gösteriyor, canlı siteleri doğrulanabilir kılıyor ve NOCTERA rolü netleşmeden müziğe aşırı ağırlık vermiyor. Zayıf yanı en "kurumsal" görünen ve iki dış sunucuya bağımlı seçenek olması.

- Tasarım/ajans tarafı öncelikliyse **A** daha güçlü bir ilk izlenim bırakır.
- NOCTERA'da yaratıcı bir rolün varsa ya da kendin müzik üretiyorsan **B** en özgün ve akılda kalıcı olanıdır; rol netleşmeden B'nin "B tarafı" anlatısı fazla iddialı kalabilir.
- Karma da mümkün: örneğin C'nin iskeleti + A'nın proje kartları.

## NOCTERA ve iş deneyimi: profilde nasıl görünmeli?

Kısa gerekçe (ayrıntılı değerlendirme yayımlanmayan yerel çalışma notlarında tutuluyor):

- **Profil README'si bir CV değil**, kısa bir açılış sayfası: yalnızca doğrulanabilir, güncel ve kimliğe uyan işler öne çıkmalı.
- **NOCTERA:** Herkese açık site (noctera.stream) ve kaynak kodu reposu doğrulanabilir bir kanıt; yalnızca "bağımsız label NOCTERA'nın herkese açık sitesi + kaynak kodu" çerçevesiyle gösterilmesi öneriliyor. Rolün (kurucu, tasarım, A&R vb.) ve müzik katılımın doğrulanmadan label adına konuşan ya da "label'ım" diyen bir ifade, logo veya sürüm başarısı kullanılmamalı.
- **İş deneyimi (reklam):** Önizlemeler varsayılan olarak gizlilik dostu: kurum adı ve unvan yazılmadı, yalnızca "2021'den beri reklam, topluluk ve marka iletişimi deneyimi" ifadesi kullanıldı. Kurum adı ve unvan, yalnızca yayımlama izni netleşirse tek satır olarak, logo ve iç bilgi olmadan eklenebilir; aksi hâlde genel ifade kalır ya da ayrıntı LinkedIn/site'ye bırakılır.
- Öneri, rolüne ve kurumların açıklama iznine göre değişebilir.

## Onay bekleyenler

`[[CONFIRM: ...]]` işaretleri bilinçli olarak görünür bırakıldı: görünen ad, NOCTERA'daki rol, müzik katılımı, tasarım araçları, uygunluk cümlesi ve **kurum adı/unvanın yayımlanıp yayımlanamayacağı**. Herhangi bir seçenek `readme.md` yerine geçmeden önce bunların yanıtlanması gerekiyor. Görseller de genel ifadeyi kullanıyor; izin gelirse yeniden üretilebilir.

<details>
<summary><samp>English summary</samp></summary>

Preview drafts only; the live `readme.md` is unchanged. Turkish versions are now primary; English files are backups with the same facts: A Studio ([TR](README-option-a-studio-tr.md) · [EN](README-option-a-studio-en.md)), B Gece Vardiyası / Night Shift ([TR](README-option-b-gece-vardiyasi-tr.md) · [EN](README-option-b-gece-vardiyasi-en.md)), C Dashboard ([TR-first](README-option-c-dashboard-tr.md) · [EN + TR](README-option-c-dashboard-en.md)). C looks like the most balanced fit for the combined design, software, music and security identity; A suits design-first audiences; B fits best once a creative NOCTERA role is confirmed. Visible `[[CONFIRM: ...]]` markers (display name, NOCTERA role, music involvement, design tools, availability, whether an organisation name/title may be published) must be resolved before any option replaces `readme.md`.

</details>
