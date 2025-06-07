// src/app/head.tsx

export default function Head() {
  return (
    <>
      {/* 뷰포트 설정: 모바일에서도 1:1 비율로 렌더링 */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* 페이지 제목 */}
      <title>유루빵</title>

      {/* 기본 메타 정보 */}
      <meta charSet="utf-8" />
      <meta name="description" content="유루빵 서비스" />

      {/* favicon (선택) */}
      <link rel="icon" href="/favicon.ico" />
    </>
  );
}
