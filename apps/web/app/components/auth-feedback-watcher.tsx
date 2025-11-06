"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "./toast-provider";
import { useAuth } from "../state/auth-context";

export function AuthFeedbackWatcher() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { push } = useToast();
  const { status } = useAuth();
  const previousStatus = useRef(status);

  useEffect(() => {
    const error = params?.get("error");
    if (!error) return;

    push({
      title: "로그인에 실패했어요",
      description: getErrorMessage(error),
      variant: "destructive",
    });

    const nextParams = new URLSearchParams(params.toString());
    nextParams.delete("error");
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [params, pathname, push, router]);

  useEffect(() => {
    if (previousStatus.current === "loading") {
      previousStatus.current = status;
      return;
    }
    if (previousStatus.current === "unauthenticated" && status === "authenticated") {
      push({ title: "로그인 완료", description: "다시 만나서 반가워요.", variant: "success" });
    }
    if (previousStatus.current === "authenticated" && status === "unauthenticated") {
      push({ title: "로그아웃됨", description: "성공적으로 로그아웃했어요." });
    }
    previousStatus.current = status;
  }, [push, status]);

  return null;
}

function getErrorMessage(code: string) {
  switch (code) {
    case "config_error":
      return "Supabase 설정이 완료되지 않아 로그인을 진행할 수 없어요.";
    case "supabase_url_missing":
      return "Supabase 프로젝트 URL이 누락되었습니다. 관리자에게 문의해 주세요.";
    case "supabase_anon_key_missing":
      return "Supabase 공개 키가 설정되지 않았습니다. 관리자에게 문의해 주세요.";
    case "supabase_service_role_key_missing":
      return "Supabase 서비스 롤 키가 필요하지만 설정되어 있지 않아요.";
    case "auth_failed":
    case "user_fetch_failed":
      return "로그인 링크를 확인할 수 없었어요. 다시 시도해 주세요.";
    case "missing_token":
      return "로그인 링크에 필요한 정보가 없어요. 새 링크를 요청해 주세요.";
    case "unsupported_flow":
      return "지원하지 않는 로그인 링크입니다. 새 링크를 요청해 주세요.";
    case "access_denied":
      return "로그인 중 권한이 거부되었어요.";
    default:
      return "로그인이 취소되었어요. 다시 시도해 주세요.";
  }
}
