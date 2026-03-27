'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useUserPreferencesStore, DefaultView, DateFormat } from '@/store/userPreferencesStore'
import { User, Layout, Calendar, Globe } from 'lucide-react'

interface UserSettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserSettingsPanel({ open, onOpenChange }: UserSettingsPanelProps) {
  const {
    displayName,
    language,
    defaultView,
    defaultArtboardSize,
    defaultArtboardOrientation,
    dateFormat,
    update,
  } = useUserPreferencesStore()

  const defaultViewOptions: { value: DefaultView; label: string }[] = [
    { value: 'dashboard', label: 'ダッシュボード' },
    { value: 'open', label: 'プロジェクトを開く' },
    { value: 'library', label: '機材マスター' },
    { value: 'documents', label: '見積・請求書' },
  ]

  const dateFormatOptions: { value: DateFormat; label: string }[] = [
    { value: 'YYYY/MM/DD', label: '2026/03/27（標準）' },
    { value: 'MM/DD/YYYY', label: '03/27/2026（米国式）' },
    { value: 'DD/MM/YYYY', label: '27/03/2026（欧州式）' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" /> ユーザー設定
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* プロフィール */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" /> プロフィール
            </h4>
            <div className="space-y-2">
              <Label>表示名</Label>
              <Input
                value={displayName}
                onChange={e => update({ displayName: e.target.value })}
                placeholder="表示に使用する名前（未入力の場合はGoogle名）"
              />
            </div>
          </div>

          <Separator />

          {/* 言語・地域 */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              <Globe className="w-4 h-4" /> 言語・地域
            </h4>
            <div className="space-y-2">
              <Label>表示言語</Label>
              <Select value={language} onValueChange={val => update({ language: val as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>日付フォーマット</Label>
              <Select value={dateFormat} onValueChange={val => update({ dateFormat: val as DateFormat })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateFormatOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* 起動設定 */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              <Layout className="w-4 h-4" /> 起動設定
            </h4>
            <div className="space-y-2">
              <Label>ログイン後のデフォルト画面</Label>
              <Select value={defaultView} onValueChange={val => update({ defaultView: val as DefaultView })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {defaultViewOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* ダイアグラム規定値 */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" /> ダイアグラム規定値
            </h4>
            <div className="space-y-2">
              <Label>デフォルト用紙サイズ</Label>
              <Select value={defaultArtboardSize} onValueChange={val => update({ defaultArtboardSize: val as any })}>
                <SelectTrigger className="max-w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="A3">A3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <Label>向き</Label>
              <span className="text-sm text-muted-foreground">縦</span>
              <Switch
                checked={defaultArtboardOrientation === 'landscape'}
                onCheckedChange={val => update({ defaultArtboardOrientation: val ? 'landscape' : 'portrait' })}
              />
              <span className="text-sm text-muted-foreground">横</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={() => { toast.success('設定を保存しました'); onOpenChange(false) }}>
            保存して閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
