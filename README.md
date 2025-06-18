# 🍞 Yuruppang Frontend / 유루빵 프론트엔드 🍞

베이킹 재고 및 레시피 관리 웹 서비스 **Yuruppang**의 프론트엔드 레포지터리입니다.  
재고 파악, 레시피 기록, 생산 계획 등을 돕는 홈베이킹 전용 서비스입니다.

## 🛠️ 기술 스택

- **Next.js**
- **Tailwind CSS**
- **TypeScript**
- 등..

## 🗂 주요 페이지 구조
```
src/
└── app/
    ├── page.tsx                         # 메인 페이지
    ├── plans/
    │   ├── page.tsx                     # 생산 계획 목록
    │   ├── [planId]/page.tsx            # 생산 계획 상세
    │   └── [planId]/complete/page.tsx   # 생산 계획 완료
    ├── recipes/
    │   ├── page.tsx                     # 레시피 메인
    │   ├── search/page.tsx              # 레시피 목록
    │   ├── categories/page.tsx          # 카테고리 관리
    │   ├── add/page.tsx                 # 레시피 추가
    │   ├── [recipeId]/page.tsx          # 레시피 상세
    │   └── [recipeId]/edit/page.tsx     # 레시피 수정
    ├── records/
    │   ├── page.tsx                     # 기록 목록
    │   ├── purchase/page.tsx            # 구매 기록 추가
    │   ├── use/page.tsx                 # 소비 기록 추가
    │   ├── [id]/page.tsx                # 기록 상세
    │   └── [id]/edit/page.tsx           # 기록 수정
    └── stock/
        ├── page.tsx                     # 재고 목록
        └── [ingredientId]/page.tsx      # 재료 상세
```

## 🧩 주요 기능 요약

- **생산 계획 관리**: 베이킹 플랜 생성, 상세 조회, 레시피 목표 수량 조정 등
- **레시피 관리** : 레시피 추가/수정, 재료 관리, 카테고리별 필터링
- **재고 관리** : 보유 중인 재료의 수량, 단위, 상세 정보 열람
- **기록 관리** : 구매/소비 이력 관리, 개별 기록 수정/삭제
- **홈 화면** : 간단한 요약 및 진입점 제공
