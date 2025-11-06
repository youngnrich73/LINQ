import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@linq/ui";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>워크스페이스 설정</CardTitle>
          <p className="text-sm text-muted-foreground">서비스가 확장될수록 이곳에서 공통 설정을 관리하세요.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            계정, 백업, 알림 설정은 <Link href="/account" className="text-primary underline">내 정보</Link> 대시보드로 옮겼어요.
          </p>
          <p className="text-sm text-muted-foreground">
            곧 팀 공유, AI 도우미, 연동 키 등 워크스페이스 단위 옵션이 추가될 예정입니다.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>프라이버시 안내</CardTitle>
          <p className="text-sm text-muted-foreground">LINQ가 참고하는 정보를 간단히 살펴보세요.</p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>데이터: 로컬에 추가한 사람, 루틴, 접점, 메모</p>
          <p>지표: 최근 접점 감쇠, 빈도, 응답성, 감정, 주제 다양성</p>
          <p>추천: 레이더 상태, 상위 5개 알림, 선택형 D-1 알림</p>
        </CardContent>
      </Card>
    </div>
  );
}
