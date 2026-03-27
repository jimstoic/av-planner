'use client'

import { useState } from 'react'
import { Building2, Landmark, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useOrgSettingsStore } from '@/store/orgSettingsStore'

export function OrgSettingsCard() {
  const [open, setOpen] = useState(false)
  const { companyInfo, taxRate, currency, update } = useOrgSettingsStore()

  const updateCompany = (field: string, value: string) => {
    update({ companyInfo: { ...companyInfo, [field]: value } })
  }

  const updateBank = (field: string, value: string) => {
    update({
      companyInfo: {
        ...companyInfo,
        bankInfo: { ...companyInfo.bankInfo!, [field]: value },
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-slate-500/50 group col-span-full md:col-span-1">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-slate-100 dark:bg-slate-800/50 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Settings2 className="w-10 h-10 text-slate-600 dark:text-slate-400" />
            </div>
            <CardTitle>組織設定</CardTitle>
            <CardDescription>会社情報・財務設定など全員共通の設定</CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-4">
            <p className="text-xs text-muted-foreground font-medium">{companyInfo.name || '未設定'}</p>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" /> 組織設定
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="company">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="company">
              <Building2 className="w-4 h-4 mr-2" />会社情報
            </TabsTrigger>
            <TabsTrigger value="financial">
              <Landmark className="w-4 h-4 mr-2" />財務設定
            </TabsTrigger>
          </TabsList>

          {/* 会社情報 */}
          <TabsContent value="company" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>会社名</Label>
                <Input value={companyInfo.name} onChange={e => updateCompany('name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>郵便番号</Label>
                <Input value={companyInfo.zipCode} onChange={e => updateCompany('zipCode', e.target.value)} placeholder="〒000-0000" />
              </div>
              <div className="space-y-2">
                <Label>電話番号</Label>
                <Input value={companyInfo.tel} onChange={e => updateCompany('tel', e.target.value)} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>住所</Label>
                <Input value={companyInfo.address} onChange={e => updateCompany('address', e.target.value)} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>メールアドレス</Label>
                <Input value={companyInfo.email} onChange={e => updateCompany('email', e.target.value)} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>適格請求書発行事業者番号（インボイス）</Label>
                <Input value={companyInfo.registrationNumber || ''} onChange={e => updateCompany('registrationNumber', e.target.value)} placeholder="T0000000000000" className="font-mono" />
              </div>
            </div>

            {/* 振込先 */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Landmark className="w-4 h-4 text-blue-500" /> 振込先情報
              </h4>
              {companyInfo.bankInfo && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>金融機関名</Label>
                    <Input value={companyInfo.bankInfo.bankName} onChange={e => updateBank('bankName', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>支店名</Label>
                    <Input value={companyInfo.bankInfo.branchName} onChange={e => updateBank('branchName', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>口座種別</Label>
                    <Select value={companyInfo.bankInfo.accountType} onValueChange={val => updateBank('accountType', val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="普通">普通</SelectItem>
                        <SelectItem value="当座">当座</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>口座番号</Label>
                    <Input value={companyInfo.bankInfo.accountNumber} onChange={e => updateBank('accountNumber', e.target.value)} className="font-mono" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>口座名義</Label>
                    <Input value={companyInfo.bankInfo.accountHolder} onChange={e => updateBank('accountHolder', e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* 財務設定 */}
          <TabsContent value="financial" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>消費税率 (%)</Label>
              <Input
                type="number"
                value={taxRate}
                onChange={e => update({ taxRate: Number(e.target.value) })}
                className="max-w-[120px]"
              />
              <p className="text-xs text-muted-foreground">見積書・請求書の消費税計算に使用されます</p>
            </div>
            <div className="space-y-2">
              <Label>通貨記号</Label>
              <Input
                value={currency}
                onChange={e => update({ currency: e.target.value })}
                className="max-w-[120px]"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-2">
          <Button onClick={() => { toast.success('設定を保存しました'); setOpen(false) }}>
            保存して閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
