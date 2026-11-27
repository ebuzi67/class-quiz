// ▶ 동물·아이템 그림을 PNG 파일로 바꾸고 싶을 때 쓰는 곳이에요.
//
//  지금은 모든 그림을 3D 모델(models.js)로 그려요. 목록·도감 카드의 작은 그림은 3D 모델을 찍은 사진이에요.
//  직접 그린 PNG로 바꾸려면 tools/cozy-room/public/pet/img/ 폴더에 파일을 넣고 (npm run publish-site 하면 cozy-room/pet/img/로 복사돼요) 아래에 경로를 적어요.
//  (정사각형, 배경이 투명한 PNG를 추천해요. 예: 512×512)
//
//  예)
//    export const PNG_ART = { poodle: "pet/img/poodle.png" };
//    표정별로 나눌 수도 있어요: poodle: { idle: "pet/img/poodle.png", happy: "pet/img/poodle-happy.png" }
//
//  PNG를 적은 동물은 목록·도감 카드에서 PNG가 보이고, 돌보기 방 안에서는 3D 모델이 그대로 움직여요.
export const PNG_ART = {
  // poodle: "pet/img/poodle.png",
};
export const PNG_ITEMS = {
  // "toy-ball": "pet/img/toy-ball.png",
};
