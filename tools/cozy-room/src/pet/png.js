// ▶ 동물·아이템 그림 (PNG·WebP 파일)
//
//  동물 그림은 사진(tools/cozy-room/art/pets-sheet.webp)을 한 마리씩 잘라 만들었어요.
//  만드는 스크립트: python3 tools/cozy-room/make_pet_art.py → tools/cozy-room/public/pet/img/ 에 저장돼요.
//  (npm run publish-site 하면 cozy-room/pet/img/ 로 복사돼요)
//
//  · 고르기·도감 카드, 이름 짓기·도감 상세의 큰 그림에 이 그림이 보여요 ("3D로 돌려 보기" 버튼도 있어요).
//  · 돌보기 방과 모모의 방에서는 움직여야 해서 3D 모델(models.js)이 그대로 나와요.
//  · idle: 보통 그림, sil: 아직 발견하지 않은 동물의 그림자 모양
//  · 다른 그림으로 바꾸려면 파일을 넣고 아래 경로를 고쳐요. 줄을 지우면 3D 모델 사진으로 돌아가요.
//    예) poodle: "pet/img/my-poodle.png"  (그림자 없이 그림 하나만 적어도 돼요)
export const PNG_ART = {
  poodle: { idle: "pet/img/poodle.webp", sil: "pet/img/poodle-sil.png" },
  corgi: { idle: "pet/img/corgi.webp", sil: "pet/img/corgi-sil.png" },
  shiba: { idle: "pet/img/shiba.webp", sil: "pet/img/shiba-sil.png" },
  golden: { idle: "pet/img/golden.webp", sil: "pet/img/golden-sil.png" },
  pomeranian: { idle: "pet/img/pomeranian.webp", sil: "pet/img/pomeranian-sil.png" },
  bichon: { idle: "pet/img/bichon.webp", sil: "pet/img/bichon-sil.png" },
  cheese: { idle: "pet/img/cheese.webp", sil: "pet/img/cheese-sil.png" },
  calico: { idle: "pet/img/calico.webp", sil: "pet/img/calico-sil.png" },
  mackerel: { idle: "pet/img/mackerel.webp", sil: "pet/img/mackerel-sil.png" },
  blackcat: { idle: "pet/img/blackcat.webp", sil: "pet/img/blackcat-sil.png" },
  russianblue: { idle: "pet/img/russianblue.webp", sil: "pet/img/russianblue-sil.png" },
  tuxedo: { idle: "pet/img/tuxedo.webp", sil: "pet/img/tuxedo-sil.png" },
  stag: { idle: "pet/img/stag.webp", sil: "pet/img/stag-sil.png" },
  rhino: { idle: "pet/img/rhino.webp", sil: "pet/img/rhino-sil.png" },
  wide: { idle: "pet/img/wide.webp", sil: "pet/img/wide-sil.png" },
  saw: { idle: "pet/img/saw.webp", sil: "pet/img/saw-sil.png" },
  king: { idle: "pet/img/king.webp", sil: "pet/img/king-sil.png" },
  chafer: { idle: "pet/img/chafer.webp", sil: "pet/img/chafer-sil.png" },
};

// 꾸미기 아이템 그림 (지금은 3D 모델 사진을 써요)
//  예) "toy-ball": "pet/img/toy-ball.png",
export const PNG_ITEMS = {
};
