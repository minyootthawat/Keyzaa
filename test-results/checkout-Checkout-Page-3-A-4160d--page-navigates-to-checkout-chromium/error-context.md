# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkout.spec.ts >> Checkout Page >> 3. Add to cart from product page navigates to checkout
- Location: e2e/checkout.spec.ts:86:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /เพิ่มลงรถเข็น|add to cart/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: /เพิ่มลงรถเข็น|add to cart/i })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - banner [ref=e12]:
    - generic [ref=e13]:
      - link "KZ Keyzaa ดิจิทัลมาร์เก็ตเพลสที่เชื่อถือได้" [ref=e14] [cursor=pointer]:
        - /url: /
        - generic [ref=e15]: KZ
        - generic [ref=e16]:
          - generic [ref=e17]: Keyzaa
          - generic [ref=e18]: ดิจิทัลมาร์เก็ตเพลสที่เชื่อถือได้
      - generic [ref=e20]:
        - img [ref=e21]
        - searchbox "ค้นหาสินค้า" [ref=e23]
      - generic [ref=e24]:
        - generic [ref=e25]: ร้านค้ายืนยันตัวตนแล้ว
        - button "สลับภาษา" [ref=e27]: TH
        - button "เปิดตะกร้าสินค้า" [ref=e28]:
          - img [ref=e29]
          - generic [ref=e31]: "1"
        - button "โปรไฟล์" [ref=e32]:
          - img [ref=e33]
  - main [ref=e35]:
    - generic [ref=e37]:
      - generic [ref=e38]:
        - generic [ref=e40]:
          - generic [ref=e41]:
            - img
          - combobox "ค้นหาสินค้า" [ref=e42]
        - generic [ref=e43]:
          - generic [ref=e44]:
            - generic [ref=e45]:
              - generic [ref=e46]: หมวดหมู่
              - generic [ref=e47]:
                - generic:
                  - img
                - combobox "หมวดหมู่" [ref=e48] [cursor=pointer]:
                  - option "ทั้งหมด" [selected]
                  - option "เติมเกม"
                  - option "Gift Card"
                  - option "Subscription"
                  - option "AI Tools"
                  - option "ดูโปรวันนี้"
            - generic [ref=e49]:
              - generic [ref=e50]: แพลตฟอร์ม
              - generic [ref=e51]:
                - generic:
                  - img
                - combobox "แพลตฟอร์ม" [ref=e52] [cursor=pointer]:
                  - option "ทั้งหมด" [selected]
                  - option "PC"
                  - option "Mobile"
                  - option "Web"
                  - option "Console"
            - generic [ref=e53]:
              - generic [ref=e54]: ช่วงราคา
              - generic [ref=e55]:
                - generic:
                  - img
                - combobox "ช่วงราคา" [ref=e56] [cursor=pointer]:
                  - option "ทั้งหมด" [selected]
                  - option "< 100"
                  - option "100-300"
                  - option "300-500"
                  - option "> 500"
          - generic [ref=e57]:
            - generic [ref=e58]: จัดเรียง
            - generic [ref=e59]:
              - generic:
                - img
              - combobox "จัดเรียง" [ref=e60] [cursor=pointer]:
                - option "ราคาถูกสุด" [selected]
                - option "ขายดี"
                - option "ลดเยอะสุด"
              - generic:
                - img
      - paragraph [ref=e61]: 12 รายการ
      - generic [ref=e62]:
        - link "เติม ROV 500 เพชร ส่งทันที รับผลลัพธ์ใน 1 นาที ใช้ได้กับบัญชีไทย เติมเกม Top seller เติม ROV 500 เพชร แพ็กยอดนิยมสำหรับการซื้อซ้ำ จ่ายแล้วรอไม่นาน 3,210 รีวิว ★ 4.8 เติมผ่าน UID บนระบบอัตโนมัติ ฿79 ฿65 10 ร้าน ซื้อเลย" [ref=e63] [cursor=pointer]:
          - /url: /products/p8
          - generic [ref=e64]:
            - img "เติม ROV 500 เพชร" [ref=e65]
            - generic [ref=e67]:
              - generic [ref=e68]: ส่งทันที
              - generic [ref=e69]: รับผลลัพธ์ใน 1 นาที
            - generic [ref=e71]: ใช้ได้กับบัญชีไทย
          - generic [ref=e72]:
            - generic [ref=e73]:
              - generic [ref=e74]: เติมเกม
              - generic [ref=e75]: Top seller
            - generic [ref=e76]:
              - heading "เติม ROV 500 เพชร" [level=3] [ref=e77]
              - paragraph [ref=e78]: แพ็กยอดนิยมสำหรับการซื้อซ้ำ จ่ายแล้วรอไม่นาน
              - generic [ref=e79]:
                - paragraph [ref=e80]: 3,210 รีวิว
                - generic [ref=e81]: ★ 4.8
                - generic [ref=e82]: เติมผ่าน UID บนระบบอัตโนมัติ
            - generic [ref=e83]:
              - generic [ref=e84]:
                - generic [ref=e85]:
                  - generic [ref=e86]: ฿79
                  - generic [ref=e87]: ฿65
                - generic [ref=e88]: 10 ร้าน
              - button "ซื้อเลย" [ref=e91]:
                - generic [ref=e92]: ซื้อเลย
        - link "โปรสุดคุ้ม Flash Deal วันนี้ ขายดี รับสิทธิ์ทันที เฉพาะดีลในไทย โปรวันนี้ Top seller โปรสุดคุ้ม Flash Deal วันนี้ ดีลไวสำหรับผู้ซื้อที่ต้องการตัดสินใจเร็วบนมือถือ 2,890 รีวิว ★ 4.8 ทำตามเงื่อนไขโปรโมชันที่แสดงก่อนชำระเงิน ฿150 ฿89 12 ร้าน ซื้อเลย" [ref=e94] [cursor=pointer]:
          - /url: /products/p7
          - generic [ref=e95]:
            - img "โปรสุดคุ้ม Flash Deal วันนี้" [ref=e96]
            - generic [ref=e98]:
              - generic [ref=e99]: ขายดี
              - generic [ref=e100]: รับสิทธิ์ทันที
            - generic [ref=e102]: เฉพาะดีลในไทย
          - generic [ref=e103]:
            - generic [ref=e104]:
              - generic [ref=e105]: โปรวันนี้
              - generic [ref=e106]: Top seller
            - generic [ref=e107]:
              - heading "โปรสุดคุ้ม Flash Deal วันนี้" [level=3] [ref=e108]
              - paragraph [ref=e109]: ดีลไวสำหรับผู้ซื้อที่ต้องการตัดสินใจเร็วบนมือถือ
              - generic [ref=e110]:
                - paragraph [ref=e111]: 2,890 รีวิว
                - generic [ref=e112]: ★ 4.8
                - generic [ref=e113]: ทำตามเงื่อนไขโปรโมชันที่แสดงก่อนชำระเงิน
            - generic [ref=e114]:
              - generic [ref=e115]:
                - generic [ref=e116]:
                  - generic [ref=e117]: ฿150
                  - generic [ref=e118]: ฿89
                - generic [ref=e119]: 12 ร้าน
              - button "ซื้อเลย" [ref=e122]:
                - generic [ref=e123]: ซื้อเลย
        - link "Steam Wallet ฿200 Gift Card ขายดี ส่งคีย์ทันที บัญชี Steam ประเทศไทย Gift Card ร้านยืนยันตัวตน Steam Wallet ฿200 Gift Card Gift card สำหรับบัญชีไทย พร้อมขั้นตอนใช้งานชัดเจน 428 รีวิว ★ 4.8 รับคีย์แล้วนำไป Redeem ใน Steam ฿200 ฿180 4 ร้าน ซื้อเลย" [ref=e125] [cursor=pointer]:
          - /url: /products/p3
          - generic [ref=e126]:
            - img "Steam Wallet ฿200 Gift Card" [ref=e127]
            - generic [ref=e129]:
              - generic [ref=e130]: ขายดี
              - generic [ref=e131]: ส่งคีย์ทันที
            - generic [ref=e133]: บัญชี Steam ประเทศไทย
          - generic [ref=e134]:
            - generic [ref=e135]:
              - generic [ref=e136]: Gift Card
              - generic [ref=e137]: ร้านยืนยันตัวตน
            - generic [ref=e138]:
              - heading "Steam Wallet ฿200 Gift Card" [level=3] [ref=e139]
              - paragraph [ref=e140]: Gift card สำหรับบัญชีไทย พร้อมขั้นตอนใช้งานชัดเจน
              - generic [ref=e141]:
                - paragraph [ref=e142]: 428 รีวิว
                - generic [ref=e143]: ★ 4.8
                - generic [ref=e144]: รับคีย์แล้วนำไป Redeem ใน Steam
            - generic [ref=e145]:
              - generic [ref=e146]:
                - generic [ref=e147]:
                  - generic [ref=e148]: ฿200
                  - generic [ref=e149]: ฿180
                - generic [ref=e150]: 4 ร้าน
              - button "ซื้อเลย" [ref=e153]:
                - generic [ref=e154]: ซื้อเลย
        - link "Spotify Premium 1 เดือน มาใหม่ ส่งภายใน 5 นาที ใช้ได้กับบัญชีไทย Subscription ร้านยืนยันตัวตน Spotify Premium 1 เดือน จ่ายง่าย รับคีย์ไว พร้อมวิธีเปิดใช้งานแบบอ่านแล้วเข้าใจ 189 รีวิว ★ 4.8 รับโค้ดแล้วนำไป Redeem บน Spotify ฿250 ฿199 6 ร้าน ซื้อเลย" [ref=e156] [cursor=pointer]:
          - /url: /products/p5
          - generic [ref=e157]:
            - img "Spotify Premium 1 เดือน" [ref=e158]
            - generic [ref=e160]:
              - generic [ref=e161]: มาใหม่
              - generic [ref=e162]: ส่งภายใน 5 นาที
            - generic [ref=e164]: ใช้ได้กับบัญชีไทย
          - generic [ref=e165]:
            - generic [ref=e166]:
              - generic [ref=e167]: Subscription
              - generic [ref=e168]: ร้านยืนยันตัวตน
            - generic [ref=e169]:
              - heading "Spotify Premium 1 เดือน" [level=3] [ref=e170]
              - paragraph [ref=e171]: จ่ายง่าย รับคีย์ไว พร้อมวิธีเปิดใช้งานแบบอ่านแล้วเข้าใจ
              - generic [ref=e172]:
                - paragraph [ref=e173]: 189 รีวิว
                - generic [ref=e174]: ★ 4.8
                - generic [ref=e175]: รับโค้ดแล้วนำไป Redeem บน Spotify
            - generic [ref=e176]:
              - generic [ref=e177]:
                - generic [ref=e178]:
                  - generic [ref=e179]: ฿250
                  - generic [ref=e180]: ฿199
                - generic [ref=e181]: 6 ร้าน
              - button "ซื้อเลย" [ref=e184]:
                - generic [ref=e185]: ซื้อเลย
        - link "Netflix Premium 1 เดือน ส่งทันที จัดส่งใน 1-5 นาที ใช้งานได้ตามเงื่อนไขบัญชี Subscription ร้านยืนยันตัวตน Netflix Premium 1 เดือน เหมาะกับลูกค้าที่ต้องการแพ็กใช้งานระยะสั้นพร้อมสถานะชำระเงินชัดเจน 215 รีวิว ★ 4.8 รับข้อมูลหรือรหัสแล้วทำตามคู่มือเปิดใช้งาน ฿300 ฿250 3 ร้าน ซื้อเลย" [ref=e187] [cursor=pointer]:
          - /url: /products/p4
          - generic [ref=e188]:
            - img "Netflix Premium 1 เดือน" [ref=e189]
            - generic [ref=e191]:
              - generic [ref=e192]: ส่งทันที
              - generic [ref=e193]: จัดส่งใน 1-5 นาที
            - generic [ref=e195]: ใช้งานได้ตามเงื่อนไขบัญชี
          - generic [ref=e196]:
            - generic [ref=e197]:
              - generic [ref=e198]: Subscription
              - generic [ref=e199]: ร้านยืนยันตัวตน
            - generic [ref=e200]:
              - heading "Netflix Premium 1 เดือน" [level=3] [ref=e201]
              - paragraph [ref=e202]: เหมาะกับลูกค้าที่ต้องการแพ็กใช้งานระยะสั้นพร้อมสถานะชำระเงินชัดเจน
              - generic [ref=e203]:
                - paragraph [ref=e204]: 215 รีวิว
                - generic [ref=e205]: ★ 4.8
                - generic [ref=e206]: รับข้อมูลหรือรหัสแล้วทำตามคู่มือเปิดใช้งาน
            - generic [ref=e207]:
              - generic [ref=e208]:
                - generic [ref=e209]:
                  - generic [ref=e210]: ฿300
                  - generic [ref=e211]: ฿250
                - generic [ref=e212]: 3 ร้าน
              - button "ซื้อเลย" [ref=e215]:
                - generic [ref=e216]: ซื้อเลย
        - link "ChatGPT Plus 1 เดือน มาใหม่ จัดส่งใน 5-10 นาที เงื่อนไขการใช้งานขึ้นกับบัญชี AI Tools ร้านยืนยันตัวตน ChatGPT Plus 1 เดือน เน้นความชัดเจนเรื่องวิธีใช้งานและเวลาส่งมอบ 120 รีวิว ★ 4.8 รับข้อมูลการใช้งานและทำตามคำแนะนำหลังซื้อ ฿500 ฿350 2 ร้าน ซื้อเลย" [ref=e218] [cursor=pointer]:
          - /url: /products/p6
          - generic [ref=e219]:
            - img "ChatGPT Plus 1 เดือน" [ref=e220]
            - generic [ref=e222]:
              - generic [ref=e223]: มาใหม่
              - generic [ref=e224]: จัดส่งใน 5-10 นาที
            - generic [ref=e226]: เงื่อนไขการใช้งานขึ้นกับบัญชี
          - generic [ref=e227]:
            - generic [ref=e228]:
              - generic [ref=e229]: AI Tools
              - generic [ref=e230]: ร้านยืนยันตัวตน
            - generic [ref=e231]:
              - heading "ChatGPT Plus 1 เดือน" [level=3] [ref=e232]
              - paragraph [ref=e233]: เน้นความชัดเจนเรื่องวิธีใช้งานและเวลาส่งมอบ
              - generic [ref=e234]:
                - paragraph [ref=e235]: 120 รีวิว
                - generic [ref=e236]: ★ 4.8
                - generic [ref=e237]: รับข้อมูลการใช้งานและทำตามคำแนะนำหลังซื้อ
            - generic [ref=e238]:
              - generic [ref=e239]:
                - generic [ref=e240]:
                  - generic [ref=e241]: ฿500
                  - generic [ref=e242]: ฿350
                - generic [ref=e243]: 2 ร้าน
              - button "ซื้อเลย" [ref=e246]:
                - generic [ref=e247]: ซื้อเลย
        - link "PUBG Mobile 1500 UC + Bonus ขายดี ส่งใน 1-3 นาที เหมาะกับผู้เล่นไทย เติมเกม Top seller PUBG Mobile 1500 UC + Bonus ทางเลือกคุ้มค่าสำหรับผู้ซื้อซ้ำที่ต้องการดีลและการจัดส่งไว 987 รีวิว ★ 4.8 เติมตาม UID พร้อมโบนัสตามโปร ฿499 ฿399 9 ร้าน ซื้อเลย" [ref=e249] [cursor=pointer]:
          - /url: /products/p11
          - generic [ref=e250]:
            - img "PUBG Mobile 1500 UC + Bonus" [ref=e251]
            - generic [ref=e253]:
              - generic [ref=e254]: ขายดี
              - generic [ref=e255]: ส่งใน 1-3 นาที
            - generic [ref=e257]: เหมาะกับผู้เล่นไทย
          - generic [ref=e258]:
            - generic [ref=e259]:
              - generic [ref=e260]: เติมเกม
              - generic [ref=e261]: Top seller
            - generic [ref=e262]:
              - heading "PUBG Mobile 1500 UC + Bonus" [level=3] [ref=e263]
              - paragraph [ref=e264]: ทางเลือกคุ้มค่าสำหรับผู้ซื้อซ้ำที่ต้องการดีลและการจัดส่งไว
              - generic [ref=e265]:
                - paragraph [ref=e266]: 987 รีวิว
                - generic [ref=e267]: ★ 4.8
                - generic [ref=e268]: เติมตาม UID พร้อมโบนัสตามโปร
            - generic [ref=e269]:
              - generic [ref=e270]:
                - generic [ref=e271]:
                  - generic [ref=e272]: ฿499
                  - generic [ref=e273]: ฿399
                - generic [ref=e274]: 9 ร้าน
              - button "ซื้อเลย" [ref=e277]:
                - generic [ref=e278]: ซื้อเลย
        - link "Steam Wallet ฿500 Gift Card ขายดี ส่งคีย์ทันทีหลังชำระสำเร็จ ใช้ได้กับบัญชี Steam ไทย Gift Card ร้านยืนยันตัวตน Steam Wallet ฿500 Gift Card เพิ่มมูลค่าในบัญชี Steam ไทยด้วยการจ่ายผ่าน PromptPay 512 รีวิว ★ 4.8 Redeem ผ่าน Wallet code ฿500 ฿445 7 ร้าน ซื้อเลย" [ref=e280] [cursor=pointer]:
          - /url: /products/p9
          - generic [ref=e281]:
            - img "Steam Wallet ฿500 Gift Card" [ref=e282]
            - generic [ref=e284]:
              - generic [ref=e285]: ขายดี
              - generic [ref=e286]: ส่งคีย์ทันทีหลังชำระสำเร็จ
            - generic [ref=e288]: ใช้ได้กับบัญชี Steam ไทย
          - generic [ref=e289]:
            - generic [ref=e290]:
              - generic [ref=e291]: Gift Card
              - generic [ref=e292]: ร้านยืนยันตัวตน
            - generic [ref=e293]:
              - heading "Steam Wallet ฿500 Gift Card" [level=3] [ref=e294]
              - paragraph [ref=e295]: เพิ่มมูลค่าในบัญชี Steam ไทยด้วยการจ่ายผ่าน PromptPay
              - generic [ref=e296]:
                - paragraph [ref=e297]: 512 รีวิว
                - generic [ref=e298]: ★ 4.8
                - generic [ref=e299]: Redeem ผ่าน Wallet code
            - generic [ref=e300]:
              - generic [ref=e301]:
                - generic [ref=e302]:
                  - generic [ref=e303]: ฿500
                  - generic [ref=e304]: ฿445
                - generic [ref=e305]: 7 ร้าน
              - button "ซื้อเลย" [ref=e308]:
                - generic [ref=e309]: ซื้อเลย
        - link "เติม PUBG Mobile 500 UC ส่งทันที รับสินค้าใน 1-3 นาที รองรับบัญชีไทย เติมเกม Top seller เติม PUBG Mobile 500 UC แพ็ก UC ยอดนิยมสำหรับสายเล่นมือถือ จ่ายง่ายและตรวจสอบออเดอร์ได้ 832 รีวิว ★ 4.8 เติมเข้าบัญชีตาม UID ฿500 ฿450 5 ร้าน ซื้อเลย" [ref=e311] [cursor=pointer]:
          - /url: /products/p2
          - generic [ref=e312]:
            - img "เติม PUBG Mobile 500 UC" [ref=e313]
            - generic [ref=e315]:
              - generic [ref=e316]: ส่งทันที
              - generic [ref=e317]: รับสินค้าใน 1-3 นาที
            - generic [ref=e319]: รองรับบัญชีไทย
          - generic [ref=e320]:
            - generic [ref=e321]:
              - generic [ref=e322]: เติมเกม
              - generic [ref=e323]: Top seller
            - generic [ref=e324]:
              - heading "เติม PUBG Mobile 500 UC" [level=3] [ref=e325]
              - paragraph [ref=e326]: แพ็ก UC ยอดนิยมสำหรับสายเล่นมือถือ จ่ายง่ายและตรวจสอบออเดอร์ได้
              - generic [ref=e327]:
                - paragraph [ref=e328]: 832 รีวิว
                - generic [ref=e329]: ★ 4.8
                - generic [ref=e330]: เติมเข้าบัญชีตาม UID
            - generic [ref=e331]:
              - generic [ref=e332]:
                - generic [ref=e333]:
                  - generic [ref=e334]: ฿500
                  - generic [ref=e335]: ฿450
                - generic [ref=e336]: 5 ร้าน
              - button "ซื้อเลย" [ref=e339]:
                - generic [ref=e340]: ซื้อเลย
        - link "Netflix Standard 3 เดือน ส่งทันที จัดส่งใน 5 นาที ตรวจสอบเงื่อนไขบัญชีก่อนใช้งาน Subscription ร้านยืนยันตัวตน Netflix Standard 3 เดือน เหมาะกับผู้ซื้อที่ต้องการสมัครใช้งานหลายเดือนพร้อมข้อมูลใช้งานครบ 120 รีวิว ★ 4.8 เปิดใช้งานตามคำแนะนำหลังซื้อ ฿657 ฿499 4 ร้าน ซื้อเลย" [ref=e342] [cursor=pointer]:
          - /url: /products/p12
          - generic [ref=e343]:
            - img "Netflix Standard 3 เดือน" [ref=e344]
            - generic [ref=e346]:
              - generic [ref=e347]: ส่งทันที
              - generic [ref=e348]: จัดส่งใน 5 นาที
            - generic [ref=e350]: ตรวจสอบเงื่อนไขบัญชีก่อนใช้งาน
          - generic [ref=e351]:
            - generic [ref=e352]:
              - generic [ref=e353]: Subscription
              - generic [ref=e354]: ร้านยืนยันตัวตน
            - generic [ref=e355]:
              - heading "Netflix Standard 3 เดือน" [level=3] [ref=e356]
              - paragraph [ref=e357]: เหมาะกับผู้ซื้อที่ต้องการสมัครใช้งานหลายเดือนพร้อมข้อมูลใช้งานครบ
              - generic [ref=e358]:
                - paragraph [ref=e359]: 120 รีวิว
                - generic [ref=e360]: ★ 4.8
                - generic [ref=e361]: เปิดใช้งานตามคำแนะนำหลังซื้อ
            - generic [ref=e362]:
              - generic [ref=e363]:
                - generic [ref=e364]:
                  - generic [ref=e365]: ฿657
                  - generic [ref=e366]: ฿499
                - generic [ref=e367]: 4 ร้าน
              - button "ซื้อเลย" [ref=e370]:
                - generic [ref=e371]: ซื้อเลย
      - button "โหลดเพิ่ม" [ref=e374]
  - generic [ref=e375]:
    - generic:
      - generic:
        - paragraph: มีข้อสงสัย? คุยกับเราสิ
        - paragraph: ตอบไวภายใน 1 นาที
    - link [ref=e376] [cursor=pointer]:
      - /url: https://line.me/ti/p/@keyzaa
      - img [ref=e377]
```

# Test source

```ts
  3   | const BASE = "http://localhost:3000";
  4   | 
  5   | test.describe("Checkout Page", () => {
  6   |   // Clear localStorage before each test to ensure isolation
  7   |   test.beforeEach(async ({ page }) => {
  8   |     await page.goto(BASE);
  9   |     await page.evaluate(() => localStorage.removeItem("keyzaa_cart"));
  10  |     await page.goto("about:blank");
  11  |   });
  12  | 
  13  |   test("1. Checkout page loads without console errors", async ({ page }) => {
  14  |     const errors: string[] = [];
  15  |     page.on("console", (msg) => {
  16  |       if (msg.type() === "error") errors.push(msg.text());
  17  |     });
  18  | 
  19  |     await page.goto(`${BASE}/checkout`);
  20  |     await page.waitForLoadState("domcontentloaded");
  21  | 
  22  |     // Wait for page to settle
  23  |     await page.waitForTimeout(1500);
  24  | 
  25  |     // No console errors (excluding Next.js warnings/hydration)
  26  |     const realErrors = errors.filter(
  27  |       (e) => !e.includes("Warning") && !e.includes("hydrat") && !e.includes("globalError"),
  28  |     );
  29  |     expect(realErrors).toHaveLength(0);
  30  |   });
  31  | 
  32  |   test("2. Cart with items shows review step", async ({ page }) => {
  33  |     const errors: string[] = [];
  34  |     page.on("console", (msg) => {
  35  |       if (msg.type() === "error") errors.push(msg.text());
  36  |     });
  37  | 
  38  |     // Pre-populate cart with demo item
  39  |     await page.goto(BASE, { waitUntil: "networkidle" });
  40  |     await page.evaluate(() => {
  41  |       localStorage.setItem("keyzaa_cart", JSON.stringify([{
  42  |         id: "p8",
  43  |         title: "ROV 500 Diamonds Top Up",
  44  |         titleTh: "เติม ROV 500 เพชร",
  45  |         titleEn: "ROV 500 Diamonds Top Up",
  46  |         price: 65,
  47  |         image: "/products/rov.png",
  48  |         quantity: 1,
  49  |         sellerId: "sel_1",
  50  |         sellerName: "Keyzaa Official",
  51  |         platform: "Mobile",
  52  |         regionCode: "TH",
  53  |         deliveryLabelTh: "รับผลลัพธ์ใน 1 นาที",
  54  |         deliveryLabelEn: "Delivered in 1 minute",
  55  |         activationMethodTh: "เติมผ่าน UID บนระบบอัตโนมัติ",
  56  |         activationMethodEn: "Automated top-up via UID"
  57  |       }]));
  58  |     });
  59  | 
  60  |     await page.goto(`${BASE}/checkout`);
  61  |     await page.waitForLoadState("domcontentloaded");
  62  |     await page.waitForTimeout(1500);
  63  | 
  64  |     // Cart review step heading should be visible
  65  |     await expect(page.getByRole("heading", { name: /ตรวจสอบออเดอร์|Review order/i })).toBeVisible({ timeout: 5000 });
  66  | 
  67  |     // Product should appear in the cart list
  68  |     await expect(page.getByText(/ROV 500 Diamonds|เติม ROV/i).first()).toBeVisible();
  69  | 
  70  |     // Price should be visible
  71  |     await expect(page.getByText(/฿65/i).first()).toBeVisible();
  72  | 
  73  |     // Order summary aside should show item (Thai: เติม ROV 500 เพชร)
  74  |     await expect(page.getByText(/เติม ROV|ROV 500/i).first()).toBeVisible();
  75  | 
  76  |     // Continue button should be present (button text: ไปหน้าชำระเงินจำลอง)
  77  |     await expect(page.getByRole("button", { name: /ชำระเงิน|จำลอง|proceed/i })).toBeVisible();
  78  | 
  79  |     // No console errors
  80  |     const realErrors = errors.filter(
  81  |       (e) => !e.includes("Warning") && !e.includes("hydrat") && !e.includes("globalError"),
  82  |     );
  83  |     expect(realErrors).toHaveLength(0);
  84  |   });
  85  | 
  86  |   test("3. Add to cart from product page navigates to checkout", async ({ page }) => {
  87  |     const errors: string[] = [];
  88  |     page.on("console", (msg) => {
  89  |       if (msg.type() === "error") errors.push(msg.text());
  90  |     });
  91  | 
  92  |     // Clear cart first
  93  |     await page.goto(BASE, { waitUntil: "networkidle" });
  94  |     await page.evaluate(() => localStorage.removeItem("keyzaa_cart"));
  95  | 
  96  |     // Go directly to a known product (ROV diamonds)
  97  |     await page.goto(`${BASE}/products/rov`);
  98  |     await page.waitForLoadState("domcontentloaded");
  99  |     await page.waitForTimeout(2000);
  100 | 
  101 |     // Click "Add to cart" secondary button
  102 |     const addToCartBtn = page.getByRole("button", { name: /เพิ่มลงรถเข็น|add to cart/i });
> 103 |     await expect(addToCartBtn).toBeVisible({ timeout: 5000 });
      |                                ^ Error: expect(locator).toBeVisible() failed
  104 |     await addToCartBtn.click();
  105 | 
  106 |     // Should navigate to checkout — wait for URL change first
  107 |     await page.waitForURL(/checkout/, { timeout: 10000 });
  108 |     // Then wait for checkout content to render
  109 |     await page.waitForLoadState("domcontentloaded");
  110 |     await page.waitForTimeout(2000);
  111 | 
  112 |     // Cart review heading should be visible (ตรวจสอบออเดอร์)
  113 |     await expect(page.getByRole("heading", { name: /ตรวจสอบออเดอร์|Review order/i })).toBeVisible({ timeout: 5000 });
  114 | 
  115 |     // No console errors
  116 |     const realErrors = errors.filter(
  117 |       (e) => !e.includes("Warning") && !e.includes("hydrat") && !e.includes("globalError"),
  118 |     );
  119 |     expect(realErrors).toHaveLength(0);
  120 |   });
  121 | 
  122 |   test("4. Cart icon in header navigates to checkout", async ({ page }) => {
  123 |     const errors: string[] = [];
  124 |     page.on("console", (msg) => {
  125 |       if (msg.type() === "error") errors.push(msg.text());
  126 |     });
  127 | 
  128 |     // Pre-populate cart
  129 |     await page.goto(BASE, { waitUntil: "networkidle" });
  130 |     await page.evaluate(() => {
  131 |       localStorage.setItem("keyzaa_cart", JSON.stringify([{
  132 |         id: "p8",
  133 |         title: "ROV 500 Diamonds Top Up",
  134 |         titleTh: "เติม ROV 500 เพชร",
  135 |         titleEn: "ROV 500 Diamonds Top Up",
  136 |         price: 65,
  137 |         image: "/products/rov.png",
  138 |         quantity: 1,
  139 |         sellerId: "sel_1",
  140 |         sellerName: "Keyzaa Official",
  141 |         platform: "Mobile",
  142 |         regionCode: "TH",
  143 |         deliveryLabelTh: "รับผลลัพธ์ใน 1 นาที",
  144 |         deliveryLabelEn: "Delivered in 1 minute",
  145 |         activationMethodTh: "เติมผ่าน UID บนระบบอัตโนมัติ",
  146 |         activationMethodEn: "Automated top-up via UID"
  147 |       }]));
  148 |     });
  149 | 
  150 |     await page.goto(BASE, { waitUntil: "networkidle" });
  151 | 
  152 |     // Click cart button in header
  153 |     await page.getByRole("button", { name: /ตะกร้า|cart/i }).click();
  154 | 
  155 |     // Should navigate to checkout
  156 |     await page.waitForURL(/\/checkout/, { timeout: 5000 });
  157 | 
  158 |     // Should show cart review (Thai: เติม ROV 500 เพชร)
  159 |     await expect(page.getByText(/เติม ROV|ROV 500/i).first()).toBeVisible({ timeout: 5000 });
  160 | 
  161 |     // No console errors
  162 |     const realErrors = errors.filter(
  163 |       (e) => !e.includes("Warning") && !e.includes("hydrat") && !e.includes("globalError"),
  164 |     );
  165 |     expect(realErrors).toHaveLength(0);
  166 |   });
  167 | 
  168 |   test("5. Continue to payment step", async ({ page }) => {
  169 |     const errors: string[] = [];
  170 |     page.on("console", (msg) => {
  171 |       if (msg.type() === "error") errors.push(msg.text());
  172 |     });
  173 | 
  174 |     // Pre-populate cart
  175 |     await page.goto(BASE, { waitUntil: "networkidle" });
  176 |     await page.evaluate(() => {
  177 |       localStorage.setItem("keyzaa_cart", JSON.stringify([{
  178 |         id: "p8",
  179 |         title: "ROV 500 Diamonds Top Up",
  180 |         titleTh: "เติม ROV 500 เพชร",
  181 |         titleEn: "ROV 500 Diamonds Top Up",
  182 |         price: 65,
  183 |         image: "/products/rov.png",
  184 |         quantity: 1,
  185 |         sellerId: "sel_1",
  186 |         sellerName: "Keyzaa Official",
  187 |         platform: "Mobile",
  188 |         regionCode: "TH",
  189 |         deliveryLabelTh: "รับผลลัพธ์ใน 1 นาที",
  190 |         deliveryLabelEn: "Delivered in 1 minute",
  191 |         activationMethodTh: "เติมผ่าน UID บนระบบอัตโนมัติ",
  192 |         activationMethodEn: "Automated top-up via UID"
  193 |       }]));
  194 |     });
  195 | 
  196 |     await page.goto(`${BASE}/checkout`);
  197 |     await page.waitForLoadState("domcontentloaded");
  198 |     await page.waitForTimeout(1500);
  199 | 
  200 |     // Click proceed to payment button (ไปหน้าชำระเงินจำลอง)
  201 |     await page.getByRole("button", { name: /ชำระเงิน|จำลอง/i }).click();
  202 | 
  203 |     // Payment step should show payment content
```