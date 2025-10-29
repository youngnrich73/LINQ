"use client";

import { useState } from "react";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@linq/ui";

import {
  clearEncryptedStore,
  exportEncryptedData,
  importEncryptedData,
} from "../../lib/encrypted-indexeddb";

const encodeSnapshot = (snapshot: Record<string, unknown>) => {
  const json = JSON.stringify(snapshot);
  if (typeof window === "undefined") {
    return json;
  }
  return window.btoa(unescape(encodeURIComponent(json)));
};

const decodeSnapshot = (payload: string) => {
  if (typeof window === "undefined") {
    return JSON.parse(payload);
  }
  return JSON.parse(decodeURIComponent(escape(window.atob(payload))));
};

export const SettingsPanel = () => {
  const [backup, setBackup] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const handleWipe = async () => {
    await clearEncryptedStore();
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }
    setStatus("모든 로컬 데이터가 삭제되었습니다.");
  };

  const handleExport = async () => {
    const snapshot = await exportEncryptedData();
    const encoded = encodeSnapshot(snapshot);
    setBackup(encoded);
    setStatus("백업 데이터를 아래 입력에 복사했습니다.");
  };

  const handleImport = async () => {
    try {
      const decoded = decodeSnapshot(backup);
      await importEncryptedData(decoded);
      setStatus("백업을 복원했습니다.");
    } catch (error) {
      setStatus("복원에 실패했습니다. 입력값을 확인하세요.");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>데이터 백업 &amp; 복원</CardTitle>
          <CardDescription>암호화된 IndexedDB 스냅샷을 내보내거나 불러옵니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button type="button" onClick={handleExport}>
              백업 생성
            </Button>
            <Button type="button" variant="outline" onClick={handleImport}>
              백업 복원
            </Button>
          </div>
          <textarea
            value={backup}
            onChange={(event) => setBackup(event.target.value)}
            placeholder="백업 문자열"
            rows={6}
            className="w-full rounded-md border border-border px-3 py-2 font-mono text-xs"
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>완전 삭제</CardTitle>
          <CardDescription>모든 로컬 데이터를 즉시 제거합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            onClick={handleWipe}
            className="border border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            데이터 완전 삭제
          </Button>
        </CardContent>
      </Card>
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
    </div>
  );
};
