import { Equipment } from '@/types/equipment';

const rawData = [
    {
        "id": "c4018e46-2d94-4052-abb8-ecd276dcfc49",
        "name": "紙の営業資料",
        "category": "紙の営業資料",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "A4 両面"
    },
    {
        "id": "294aff1c-9468-449e-859b-2efb84d6f35e",
        "name": "Peplink UBR LTE",
        "category": "ペップリンク",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "SOFTBANK(100GB/月)\r\ndocomo(30GB/月)"
    },
    {
        "id": "a3b0f820-0218-42e9-ba6c-7a3124a3e022",
        "name": "RADIAL Twin-Iso",
        "category": "アイソレーター",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "https://drive.google.com/drive/folders/1d7DUd4XojWneqkBNzZhu-MtS2PCkM2KX"
    },
    {
        "id": "0afcb60f-598c-472e-8915-19c7cad19c34",
        "name": "Roland UVC-01",
        "category": "ビデオキャプチャ",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "8f6bfa60-74c5-4a1a-84cf-7bd5233e8971",
        "name": "黒布",
        "category": "黒布",
        "stock": 4,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "8d469367-b8c2-4aaf-90aa-d66f3efbf4ed",
        "name": "ドライバーセット",
        "category": "ドライバーセット",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "ねじ用"
    },
    {
        "id": "0d90d14e-8761-41f9-89ee-5e797e93a7ea",
        "name": "電動ドライバー",
        "category": "電動ドライバー",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "3dbeeb41-9922-4196-bfd5-1834baaec0a1",
        "name": "solidcom c1",
        "category": "インカム",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "6個セット"
    },
    {
        "id": "2cfacbd4-f2b2-4072-af6b-1d871cb2ff0b",
        "name": "solidcom c1",
        "category": "インカム",
        "stock": 1,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": "4個セット"
    },
    {
        "id": "fc1b202f-e6af-4c18-9f4b-1c7a59632398",
        "name": "PerfectCue Mini",
        "category": "パーフェクトキュー",
        "stock": 1,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": "戻るボタン有/レーザーポインタ無"
    },
    {
        "id": "59cc3203-fb21-40d8-b319-6b57fd5e627d",
        "name": "必要分",
        "category": "乾電池",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "複数本"
    },
    {
        "id": "113c297f-473b-46ad-85cd-62e428d57bbc",
        "name": "30m",
        "category": "ドラム電源",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "32d532ab-a60f-48e5-8a71-ccbd1e6da7e5",
        "name": "必要分",
        "category": "電源コード",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "一式"
    },
    {
        "id": "036c8536-8099-465b-9aee-e6b9640aca71",
        "name": "必要分",
        "category": "養生マット,ベリベリ等",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "一式"
    },
    {
        "id": "7ef78e1a-098d-4802-9e78-a42dbb10a942",
        "name": "必要分",
        "category": "養生テープ",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "一式"
    },
    {
        "id": "347ff346-10ba-4131-bc60-ddc42480a787",
        "name": "必要分",
        "category": "ポストイット",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "PCの役割を書く用"
    },
    {
        "id": "c33ec670-8a23-424a-956b-f946f2256d19",
        "name": "進行表出力",
        "category": "進行表出力",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "1e5f5509-a63b-45ee-9343-a6d2c5f6c3ac",
        "name": "必要分",
        "category": "電源コード",
        "stock": 1,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": "一式"
    },
    {
        "id": "e60794a4-74ba-4c51-9dd2-ca18a60962f7",
        "name": "必要分",
        "category": "養生マット,ベリベリ等",
        "stock": 1,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": "一式"
    },
    {
        "id": "38b9f54f-8f76-4f9b-86aa-3f88d3fb75a6",
        "name": "必要分",
        "category": "養生テープ",
        "stock": 1,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": "一式"
    },
    {
        "id": "d97aa923-9fa3-4a87-a04b-a2d253cce4c6",
        "name": "必要分",
        "category": "ポストイット",
        "stock": 1,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": "一式"
    },
    {
        "id": "760a5b67-d45f-4780-b453-043cb356f675",
        "name": "進行表出力",
        "category": "進行表出力",
        "stock": 1,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "231db7f8-d6aa-4cf6-aca1-60378c5ff852",
        "name": "SmallRig AD-100 3989",
        "category": "カメラ三脚 197cm NEW",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "bb1d9e41-a88a-4f2a-878a-d1c1eb56a23c",
        "name": "SmallRig AD-80 4163",
        "category": "カメラ三脚 191cm NEW",
        "stock": 2,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "4d7840d5-29cc-43db-90b7-ed0b76c5839d",
        "name": "SmallRIg AD-01 3751B",
        "category": "カメラ三脚 186cm",
        "stock": 1,
        "location": "Unknown",
        "specs": "",
        "accessories": "",
        "notes": "これを量産型にする？？"
    },
    {
        "id": "d687f908-356f-40c4-920a-238b2bc3c184",
        "name": "カメラ三脚 190cm",
        "category": "カメラ三脚 190cm",
        "stock": 4,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "26db935e-8625-47c5-bf4c-b79fe165b303",
        "name": "ACEBIL i605dx",
        "category": "カメラ三脚 150cm",
        "stock": 3,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "d2362c1e-3f69-4109-872e-b2fafd9857ad",
        "name": "Libec リーベック 650EX",
        "category": "カメラ三脚 150cm",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "52da9a69-b2eb-4d53-974b-6edf91e119ec",
        "name": "カメラドリー",
        "category": "カメラドリー",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "857be556-6bd3-42d6-aa5c-e3780b191ed7",
        "name": "Libec TH-X",
        "category": "カメラ三脚",
        "stock": 2,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "75b2bd3e-af60-43dc-a14f-80dd3697b294",
        "name": "JVC GY-HM175",
        "category": "カメラ",
        "stock": 3,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "SDカード忘れずに"
    },
    {
        "id": "0fce81b8-19cb-4131-82b2-d5068454f133",
        "name": "SONY FDR-AX45",
        "category": "カメラ",
        "stock": 3,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "SDカード忘れずに"
    },
    {
        "id": "0c10bdaf-2029-43ea-941e-781aca3c23a4",
        "name": "SONY SRG-A40",
        "category": "カメラ(PTZ)",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "SDI出力orHDMI出力 長尺LAN"
    },
    {
        "id": "e61643ba-c84d-45d4-ae7d-4cdf00797f44",
        "name": "JVC PTZ",
        "category": "カメラ(PTZ)",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "SDI出力orHDMI出力 長尺LAN コントローラー忘れずに"
    },
    {
        "id": "72d41c2c-4b6e-434b-8c2d-b53c611834e8",
        "name": "CANON XF605",
        "category": "カメラ",
        "stock": 3,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": "SDカード忘れずに"
    },
    {
        "id": "be3aa487-c792-4012-a3f8-b8ea9e313aa3",
        "name": "CANON XA75",
        "category": "カメラ",
        "stock": 2,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": "SDカード忘れずに"
    },
    {
        "id": "40d88d65-6c2a-4aac-923b-c4debd234554",
        "name": "ATEM Television studio 4K",
        "category": "スイッチャー",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "売却予定"
    },
    {
        "id": "7d29faff-6189-4b82-b1b7-53fb3aebf1c2",
        "name": "ATEM SDI Pro ISO",
        "category": "スイッチャー",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "ef99ae19-9e00-4455-b3f4-42307d84fbb7",
        "name": "ATEM MINI EXTREAM ISO",
        "category": "スイッチャー",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "22e1834a-e14d-477f-9209-8aa11ebc782a",
        "name": "ATEM MINI PRO ISO",
        "category": "スイッチャー",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "949b3003-8473-4b14-94e4-8d7f6c9d0c5f",
        "name": "ATEM MINI PRO",
        "category": "スイッチャー",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "1e6d7e71-b22e-4ae8-8ae7-0353cdf526f2",
        "name": "ATEM MINI PRO",
        "category": "スイッチャー",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "粕谷デスクにある"
    },
    {
        "id": "21e0266c-e589-4ecc-b1bf-4daaaeb6e8ae",
        "name": "ATEM MINI PRO",
        "category": "スイッチャー",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "平松デスクにはない"
    },
    {
        "id": "addf169e-ec5a-4b19-9497-5c49a947828c",
        "name": "ATEM MINI",
        "category": "スイッチャー",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "bcd1b5fd-983e-4258-9235-738a548d1f94",
        "name": "Roland V-160HD",
        "category": "スイッチャー",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "aa8a4f5a-9f4a-4b4b-8c44-593e23abd550",
        "name": "Roland VR-120HD",
        "category": "スイッチャー",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "cc1fcab6-d0ec-4558-a9d8-91d3d65f30fa",
        "name": "Roland V1-HD",
        "category": "スイッチャー",
        "stock": 2,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "3572532a-c5d8-4bf1-aa9c-9d0784fca843",
        "name": "Roland V2-HD MK2",
        "category": "スイッチャー",
        "stock": 2,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "d9ebed3a-c3a5-4b74-9e0a-4c00b7c2392d",
        "name": "ATEM SDI Extreme ISO",
        "category": "スイッチャー",
        "stock": 1,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "6ae0e70a-5203-4ad2-b8dc-d35f85bd0fd8",
        "name": "ATEM MINI PRO",
        "category": "スイッチャー",
        "stock": 1,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "662efacf-eca5-4357-a13f-4091842bfe4a",
        "name": "Roland V1-SDI",
        "category": "スイッチャー",
        "stock": 1,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "d3378540-0ac8-442c-96bc-c0e531ea2ab4",
        "name": "Roland V1-HD",
        "category": "スイッチャー",
        "stock": 1,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "00cacf44-bca4-4676-93dc-7e4821635343",
        "name": "BMD VIDEO ASSIST",
        "category": "録画機(兼モニター)",
        "stock": 2,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "975ed3ce-efd4-4868-9054-e592a0fbdddc",
        "name": "BMD VIDEO ASSIST",
        "category": "収録機(兼モニター)",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "8edf2a2d-e980-4a8e-b0c6-e80b6a514691",
        "name": "Hyper deck Studio HD Plus",
        "category": "収録機/動画再生機",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "6d87c31e-977f-49d8-8da0-7bc4365c7a57",
        "name": "Blackmagic Web Presenter 4K",
        "category": "エンコーダー",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "3a446f00-c074-41bb-af81-eca189ea7819",
        "name": "Blackmagic Web Presenter HD",
        "category": "エンコーダー",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "14208b3b-8994-4f85-a03e-e94a7b2b2fb8",
        "name": "Live Shell X",
        "category": "エンコーダー",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "売却予定"
    },
    {
        "id": "00295d98-2b9b-4387-85db-9ca788d1a4a7",
        "name": "AJA U-TAP SDI",
        "category": "ビデオキャプチャ",
        "stock": 3,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "5a2f7b5a-40b4-407e-81f4-4cb8f9a56d9f",
        "name": "AJA U-TAP HDMI",
        "category": "ビデオキャプチャ",
        "stock": 3,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "27beb9cf-e0b4-47df-82ce-a8f5408f5a59",
        "name": "T7 Shield (2TB)",
        "category": "SSD",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "031b9b94-c713-42aa-b277-ec96c8fa809d",
        "name": "T7 (2TB)",
        "category": "SSD",
        "stock": 2,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "f962b361-c79f-499a-94b7-ddf45a5a4ab9",
        "name": "T5 (1TB)",
        "category": "SSD",
        "stock": 2,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "a316e8e6-1aec-4137-ba6c-d7abb1a3b50d",
        "name": "2TB SanDisk Extream Portable SSD",
        "category": "SSD",
        "stock": 1,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": "SDSSDE61-2T00"
    },
    {
        "id": "16e79758-488f-45ea-9281-1eca1dce1a24",
        "name": "55インチモニター",
        "category": "55インチモニター",
        "stock": 2,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "スタンド付き"
    },
    {
        "id": "49739694-66ac-4e46-8aa3-b024dfc0e099",
        "name": "32インチモニター",
        "category": "32インチモニター",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "タイヤ付き"
    },
    {
        "id": "9e89f870-0ee0-4a39-bb49-a62480c4220f",
        "name": "24インチモニター",
        "category": "24インチモニター",
        "stock": 2,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "24c6a933-8ac8-4cbb-989b-0c779ee41882",
        "name": "GeChic スルーアウト",
        "category": "15インチHDMIモニター",
        "stock": 2,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "1e2e83eb-9505-4c60-8e9e-95bce9b8cea4",
        "name": "15インチHDMIモニター",
        "category": "15インチHDMIモニター",
        "stock": 2,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "1eaa4756-c81f-400c-904c-87df9061d596",
        "name": "15インチHDMIモニター(端子MINI)",
        "category": "15インチHDMIモニター(端子MINI)",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "0a3cfdf7-7b02-49cf-8a94-eaf94b03b5f2",
        "name": "10インチHDMIモニター",
        "category": "10インチHDMIモニター",
        "stock": 4,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "19d92207-1498-49d8-9ff2-5a6eb2ab6355",
        "name": "SEETEC",
        "category": "HDMIマルチモニター",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "4IN/4OUT"
    },
    {
        "id": "a77b3ac6-a7ca-48c3-b1e3-67f0c8da893c",
        "name": "SEETEC P173-9HSD-CO17.3",
        "category": "SDIモニター(17.3インチ)",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "1IN/1OUT"
    },
    {
        "id": "f745aeef-a427-4586-9f7b-176fd413a169",
        "name": "SDS ML-3255",
        "category": "モニタースタンド(ロー)",
        "stock": 1,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "c7d621e1-6c3c-4a37-bbb0-2aed95d36a75",
        "name": "MAXZEN J43CH06",
        "category": "43インチモニター",
        "stock": 1,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "d935ea47-661c-4aea-b20e-cbb72bf3e8a7",
        "name": "iiyama ProLite XUB2792UHSU-B6",
        "category": "27インチモニター",
        "stock": 1,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": "4K 基本CGPデスク固定"
    },
    {
        "id": "459e0da6-8e26-4bc3-8ac3-817f3e0e769c",
        "name": "JAPANNEXT 23.8インチ IPS WQHD",
        "category": "23.8インチモニター",
        "stock": 1,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "6d254a4c-ddef-4bab-b052-a99babd60a7a",
        "name": "LCD1560S(15.6型ワイド)",
        "category": "15.6インチマルチフォーマットモニター",
        "stock": 1,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "d7d09fa2-d165-45a5-93fb-c7bf4445c5f0",
        "name": "InnoView",
        "category": "13インチモバイルもタニター",
        "stock": 2,
        "location": "T",
        "specs": "",
        "accessories": "",
        "notes": ""
    },
    {
        "id": "a0bd336f-c944-47a2-a68c-4fa59cd769d4",
        "name": "00-GALLERIA",
        "category": "PC 修理継続しない",
        "stock": 1,
        "location": "F",
        "specs": "",
        "accessories": "",
        "notes": "Bランク"
    }
];

const inferCategory = (name: string, rawCategory: string): { major: EquipmentCategory, sub: EquipmentSubCategory } => {
    const n = name.toLowerCase();
    const c = rawCategory.toLowerCase();

    if (n.includes('camera') || n.includes('カメラ') || c.includes('カメラ')) return { major: 'video', sub: 'camera' };
    if (n.includes('switcher') || n.includes('スイッチャー') || c.includes('スイッチャー')) return { major: 'video', sub: 'switcher' };
    if (n.includes('monitor') || n.includes('モニター') || c.includes('モニター')) return { major: 'video', sub: 'display' };
    if (n.includes('converter') || n.includes('コンバーター') || c.includes('ビデオキャプチャ')) return { major: 'video', sub: 'converter' };
    if (n.includes('cable') || n.includes('ケーブル') || c.includes('ケーブル')) return { major: 'video', sub: 'cable' };

    if (n.includes('mic') || n.includes('マイク') || c.includes('マイク')) return { major: 'audio', sub: 'microphone' };
    if (n.includes('mixer') || n.includes('ミキサー') || c.includes('ミキサー')) return { major: 'audio', sub: 'mixer' };
    if (n.includes('speaker') || n.includes('スピーカー') || c.includes('スピーカー')) return { major: 'audio', sub: 'speaker' };

    if (n.includes('pc') || n.includes('mac') || c.includes('pc')) return { major: 'control', sub: 'pc' };
    if (n.includes('network') || n.includes('router') || c.includes('ペップリンク') || n.includes('peplink')) return { major: 'control', sub: 'network' };

    if (n.includes('generator') || n.includes('電源') || c.includes('電源')) return { major: 'power', sub: 'distro' };
    if (n.includes('tripod') || n.includes('三脚') || c.includes('三脚')) return { major: 'video', sub: 'accessory' };

    return { major: 'other', sub: 'other' };
};

const inferManufacturer = (name: string, rawCategory: string): string => {
    const text = (name + " " + rawCategory).toLowerCase();

    if (text.includes('roland')) return 'Roland';
    if (text.includes('sony')) return 'SONY';
    if (text.includes('panasonic')) return 'Panasonic';
    if (text.includes('canon')) return 'Canon';
    if (text.includes('blackmagic') || text.includes('bmd') || text.includes('atem')) return 'Blackmagic Design';
    if (text.includes('jvc')) return 'JVC';
    if (text.includes('yamaha')) return 'Yamaha';
    if (text.includes('shure')) return 'Shure';
    if (text.includes('sennheiser')) return 'Sennheiser';
    if (text.includes('smallrig')) return 'SmallRig';
    if (text.includes('libec')) return 'Libec';
    if (text.includes('peplink')) return 'Peplink';
    if (text.includes('radial')) return 'Radial';

    // If category looks like a manufacturer (no japanese characters, short/medium length), use it
    if (!rawCategory.match(/[^\x01-\x7E]/) && rawCategory.length > 2 && rawCategory.length < 20) {
        return rawCategory;
    }

    return "";
};

export const initialEquipment: Equipment[] = rawData.map(item => {
    const { major, sub } = inferCategory(item.name, item.category);
    const manufacturer = inferManufacturer(item.name, item.category);

    return {
        id: item.id,
        name: item.name,
        majorCategory: major,
        subCategory: sub,
        manufacturer: manufacturer,
        description: item.notes + (item.location ? ` [Location: ${item.location}]` : ""),
        stockQuantity: item.stock,
        inputPortCount: 0,
        outputPortCount: 0,
        dayRate: 0,
        imageUrl: "",
        powerConsumption: 0,
        weight: 0,
        category: item.category // Keep original category in legacy field if needed
    };
});
