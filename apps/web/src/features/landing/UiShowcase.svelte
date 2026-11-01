<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
  } from '$lib/components/ui/card'
  import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
  } from '$lib/components/ui/tabs'
  import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
  } from '$lib/components/ui/dialog'
  import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
  } from '$lib/components/ui/alert-dialog'
  import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose,
  } from '$lib/components/ui/sheet'
  import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverDescription,
  } from '$lib/components/ui/popover'
  import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
  } from '$lib/components/ui/tooltip'
  import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
  } from '$lib/components/ui/accordion'
  import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from '$lib/components/ui/breadcrumb'
  import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
  } from '$lib/components/ui/table'
  import {
    Avatar,
    AvatarImage,
    AvatarFallback,
    AvatarGroup,
  } from '$lib/components/ui/avatar'
  import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert'
  import { Separator } from '$lib/components/ui/separator'
  import { Input } from '$lib/components/ui/input'
  import { Textarea } from '$lib/components/ui/textarea'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Switch } from '$lib/components/ui/switch'
  import { Slider } from '$lib/components/ui/slider'
  import { Progress } from '$lib/components/ui/progress'
  import { Skeleton } from '$lib/components/ui/skeleton'
  import { Kbd } from '$lib/components/ui/kbd'
  import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
  } from '$lib/components/ui/select'
  import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group'
  import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group'
  import { toast } from 'svelte-sonner'

  import CheckCircleIcon from '~icons/lucide/check-circle-2'
  import InfoIcon from '~icons/lucide/info'
  import SparklesIcon from '~icons/lucide/sparkles'
  import AlertTriangleIcon from '~icons/lucide/alert-triangle'
  import SlidersIcon from '~icons/lucide/sliders'
  import EyeIcon from '~icons/lucide/eye'
  import LayersIcon from '~icons/lucide/layers-3'
  import CpuIcon from '~icons/lucide/cpu'
  import BoldIcon from '~icons/lucide/bold'
  import ItalicIcon from '~icons/lucide/italic'
  import UnderlineIcon from '~icons/lucide/underline'
  import BellIcon from '~icons/lucide/bell'

  let demoInput = $state('Antigravity Starter')
  let demoTextarea = $state('Dukungan penuh Svelte 5 runes dan Tailwind CSS 4.')
  let demoCheckbox = $state(true)
  let demoSwitch = $state(true)
  let demoSlider = $state([68])
  let demoRadio = $state('bun')
  let demoSelect = $state('bun')
  let demoToggleGroup = $state(['bold'])
  let dialogOpen = $state(false)
  let alertDialogOpen = $state(false)
  let sheetOpen = $state(false)
  let activeTab = $state('primitives')
</script>

<div
  class="mt-12 rounded-3xl border border-border bg-panel p-6 shadow-2xl sm:p-8"
>
  <div
    class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
  >
    <div>
      <div class="flex items-center gap-2.5">
        <span
          class="inline-flex size-9 items-center justify-center rounded-xl bg-brand/10 text-brand"
        >
          <SparklesIcon class="size-5" aria-hidden="true" />
        </span>
        <h3 class="text-2xl font-bold tracking-tight text-foreground">
          Katalog Komponen shadcn-svelte
        </h3>
      </div>
      <p class="mt-1.5 text-sm text-muted">
        Galeri interaktif live preview dari 60 komponen resmi shadcn-svelte,
        dibangun dengan Svelte 5 Runes dan Tailwind CSS 4.
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <Badge variant="green">60 Komponen Siap Pakai</Badge>
      <Badge variant="orange">Svelte 5 Runes</Badge>
    </div>
  </div>

  <Separator class="my-6" />

  <Tabs bind:value={activeTab} class="w-full">
    <TabsList class="flex w-full flex-wrap gap-1 sm:w-auto">
      <TabsTrigger value="primitives" class="px-3.5 py-1.5">
        <span class="inline-flex items-center gap-1.5">
          <SparklesIcon class="size-3.5" aria-hidden="true" />
          <span>Dasar &amp; Tombol</span>
        </span>
      </TabsTrigger>
      <TabsTrigger value="forms" class="px-3.5 py-1.5">
        <span class="inline-flex items-center gap-1.5">
          <SlidersIcon class="size-3.5" aria-hidden="true" />
          <span>Formulir &amp; Kontrol</span>
        </span>
      </TabsTrigger>
      <TabsTrigger value="overlays" class="px-3.5 py-1.5">
        <span class="inline-flex items-center gap-1.5">
          <EyeIcon class="size-3.5" aria-hidden="true" />
          <span>Dialog, Modal &amp; Toast</span>
        </span>
      </TabsTrigger>
      <TabsTrigger value="data" class="px-3.5 py-1.5">
        <span class="inline-flex items-center gap-1.5">
          <LayersIcon class="size-3.5" aria-hidden="true" />
          <span>Data &amp; Struktur</span>
        </span>
      </TabsTrigger>
      <TabsTrigger value="interactive" class="px-3.5 py-1.5">
        <span class="inline-flex items-center gap-1.5">
          <CpuIcon class="size-3.5" aria-hidden="true" />
          <span>AI &amp; Panduan Akses</span>
        </span>
      </TabsTrigger>
    </TabsList>

    <!-- Tab 1: Komponen Dasar (Buttons, Badges, Alerts, Kbd, Separator) -->
    <TabsContent value="primitives" class="mt-6 space-y-6">
      <div>
        <h4 class="text-xs font-semibold tracking-wider text-muted uppercase">
          Varian Tombol (Buttons)
        </h4>
        <p class="mt-1 text-xs text-muted">
          Mendukung berbagai gaya visual, ukuran, pill shape, dan status loading
          reaktif.
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <Button variant="default">Tombol Utama</Button>
          <Button variant="brand">Brand Flame (#c2370a)</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Garis Luar</Button>
          <Button variant="ghost">Tanpa Bingkai</Button>
          <Button variant="destructive">Hapus / Bahaya</Button>
          <Button variant="brand" size="pill">Bentuk Pill</Button>
          <Button variant="outline" size="sm">Ukuran Kecil (sm)</Button>
          <Button variant="default" size="lg">Ukuran Besar (lg)</Button>
          <Button variant="brand" disabled>Nonaktif</Button>
        </div>
      </div>

      <Separator />

      <div>
        <h4 class="text-xs font-semibold tracking-wider text-muted uppercase">
          Varian Lencana (Badges)
        </h4>
        <p class="mt-1 text-xs text-muted">
          Indikator status kontekstual dengan kontras tinggi WCAG AA.
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-2.5">
          <Badge variant="default">Default Ink</Badge>
          <Badge variant="secondary">Secondary Tone</Badge>
          <Badge variant="outline">Outline Border</Badge>
          <Badge variant="yellow">Perhatian 304</Badge>
          <Badge variant="green">Aktif 200 OK</Badge>
          <Badge variant="orange">Pemberitahuan Urgent</Badge>
        </div>
      </div>

      <Separator />

      <div>
        <h4 class="text-xs font-semibold tracking-wider text-muted uppercase">
          Pemberitahuan &amp; Banner (Alerts)
        </h4>
        <div class="mt-3 grid gap-3 sm:grid-cols-2">
          <Alert variant="default" role="region" aria-label="Informasi Desain">
            <InfoIcon class="size-4" aria-hidden="true" />
            <AlertTitle>Desain Modular</AlertTitle>
            <AlertDescription>
              Komponen sepenuhnya dimiliki di dalam repositori Anda tanpa
              dependensi tersembunyi.
            </AlertDescription>
          </Alert>
          <Alert
            variant="success"
            role="region"
            aria-label="Status Aksesibilitas"
          >
            <CheckCircleIcon class="size-4" aria-hidden="true" />
            <AlertTitle>Kontras WCAG AA Terpenuhi</AlertTitle>
            <AlertDescription>
              Seluruh palet warna memenuhi rasio kontras 4.5:1 untuk teks biasa
              dan 3:1 untuk teks besar.
            </AlertDescription>
          </Alert>
          <Alert
            variant="warning"
            role="region"
            aria-label="Peringatan Kapasitas"
          >
            <AlertTriangleIcon class="size-4" aria-hidden="true" />
            <AlertTitle>Pemberitahuan Pemantauan</AlertTitle>
            <AlertDescription>
              Endpoint Prometheus dilindungi oleh token otorisasi Bearer.
            </AlertDescription>
          </Alert>
          <Alert
            variant="destructive"
            role="region"
            aria-label="Kesalahan Operasional"
          >
            <AlertTriangleIcon class="size-4" aria-hidden="true" />
            <AlertTitle>Penanganan Error Aman</AlertTitle>
            <AlertDescription>
              Error 500 disanitasi secara otomatis sebelum dikirimkan ke
              peramban.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <Separator />

      <div>
        <h4 class="text-xs font-semibold tracking-wider text-muted uppercase">
          Pintasan Papan Ketik (Keyboard Shortcuts - Kbd)
        </h4>
        <div
          class="mt-3 flex flex-wrap items-center gap-4 text-sm text-foreground"
        >
          <span class="inline-flex items-center gap-1.5">
            <span>Buka Pencarian:</span>
            <Kbd>⌘</Kbd>
            <span>+</span>
            <Kbd>K</Kbd>
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span>Simpan Perubahan:</span>
            <Kbd>Ctrl</Kbd>
            <span>+</span>
            <Kbd>S</Kbd>
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span>Pindah Fokus:</span>
            <Kbd>Tab</Kbd>
          </span>
        </div>
      </div>
    </TabsContent>

    <!-- Tab 2: Formulir & Kontrol (Input, Textarea, Checkbox, Switch, Slider, Select, RadioGroup, ToggleGroup) -->
    <TabsContent value="forms" class="mt-6 space-y-6">
      <div class="grid gap-6 md:grid-cols-2">
        <Card class="bg-panel border-border">
          <CardHeader>
            <CardTitle>Bidang Teks &amp; Area Catatan</CardTitle>
            <CardDescription>
              Input dan Textarea dengan reaktivitas binding dua arah.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-1.5">
              <label
                for="demo-input"
                class="text-xs font-medium text-foreground"
              >
                Judul Starter
              </label>
              <Input
                id="demo-input"
                bind:value={demoInput}
                placeholder="Ketik teks untuk melihat reaktivitas..."
              />
            </div>
            <div class="space-y-1.5">
              <label
                for="demo-textarea"
                class="text-xs font-medium text-foreground"
              >
                Deskripsi Singkat
              </label>
              <Textarea
                id="demo-textarea"
                bind:value={demoTextarea}
                rows={3}
                placeholder="Tulis deskripsi..."
              />
            </div>
            {#if demoInput}
              <p class="text-xs text-muted">
                Nilai aktif: <span class="font-mono font-medium text-foreground"
                  >{demoInput}</span
                >
              </p>
            {/if}
          </CardContent>
          <CardFooter class="justify-between border-t border-border/50 pt-4">
            <span class="text-xs text-muted"
              >Karakter: {demoTextarea.length}</span
            >
            <Button size="sm" variant="brand">Simpan Input</Button>
          </CardFooter>
        </Card>

        <Card class="bg-panel border-border">
          <CardHeader>
            <CardTitle>Sakelar, Pilihan &amp; Penggeser</CardTitle>
            <CardDescription>
              Checkbox, Switch, Slider, dan Radio Group.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-5">
            <!-- Switch -->
            <div
              class="flex items-center justify-between rounded-xl bg-canvas-subtle/50 p-3"
            >
              <div class="space-y-0.5">
                <label
                  for="sw-telemetry"
                  class="text-xs font-medium text-foreground cursor-pointer"
                >
                  Observability Telemetri
                </label>
                <p class="text-xs text-muted">
                  Ekspor metrik Prometheus ke endpoint /api/metrics.
                </p>
              </div>
              <Switch id="sw-telemetry" bind:checked={demoSwitch} />
            </div>

            <!-- Checkbox -->
            <div class="flex items-center gap-2.5">
              <Checkbox id="chk-strict" bind:checked={demoCheckbox} />
              <label
                for="chk-strict"
                class="text-xs font-medium text-foreground cursor-pointer select-none"
              >
                Aktifkan validasi Zod ketat pada setiap payload masuk
              </label>
            </div>

            <!-- Slider -->
            <div class="space-y-2">
              <div
                class="flex justify-between text-xs font-medium text-foreground"
              >
                <label for="slider-level">Tingkat Pengujian Otomatis</label>
                <span class="font-mono text-brand font-semibold"
                  >{demoSlider[0]}%</span
                >
              </div>
              <Slider
                type="multiple"
                id="slider-level"
                bind:value={demoSlider}
                min={10}
                max={100}
                step={5}
              />
            </div>

            <!-- Select -->
            <div class="space-y-1.5">
              <label
                for="sel-runtime"
                class="text-xs font-medium text-foreground"
              >
                Target Lingkungan Deploy
              </label>
              <Select type="single" bind:value={demoSelect}>
                <SelectTrigger id="sel-runtime" class="w-full">
                  <SelectValue placeholder="Pilih runtime..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bun"
                    >Bun Linux (Native Container)</SelectItem
                  >
                  <SelectItem value="cloudflare"
                    >Cloudflare Workers (Edge Serverless)</SelectItem
                  >
                  <SelectItem value="universal"
                    >Universal Node.js Engine</SelectItem
                  >
                </SelectContent>
              </Select>
            </div>

            <!-- Toggle Group -->
            <div class="space-y-1.5">
              <span class="text-xs font-medium text-foreground"
                >Format Tampilan</span
              >
              <ToggleGroup
                type="multiple"
                bind:value={demoToggleGroup}
                class="justify-start"
              >
                <ToggleGroupItem value="bold" aria-label="Teks tebal">
                  <BoldIcon class="size-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="Teks miring">
                  <ItalicIcon class="size-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="underline"
                  aria-label="Teks garis bawah"
                >
                  <UnderlineIcon class="size-3.5" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <!-- Radio Group -->
            <div class="space-y-1.5">
              <span class="text-xs font-medium text-foreground"
                >Mesin Eksekusi (Radio Group)</span
              >
              <RadioGroup bind:value={demoRadio} class="flex gap-4">
                <div class="flex items-center gap-1.5">
                  <RadioGroupItem value="bun" id="r-bun" />
                  <label
                    for="r-bun"
                    class="text-xs text-foreground cursor-pointer"
                    >Bun Native</label
                  >
                </div>
                <div class="flex items-center gap-1.5">
                  <RadioGroupItem value="workers" id="r-workers" />
                  <label
                    for="r-workers"
                    class="text-xs text-foreground cursor-pointer"
                    >Cloudflare</label
                  >
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>

    <!-- Tab 3: Overlays & Dialogs (Dialog, Alert Dialog, Sheet, Popover, Tooltip, Sonner) -->
    <TabsContent value="overlays" class="mt-6 space-y-6">
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <!-- Dialog Modal -->
        <Card class="bg-panel border-border flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Dialog Modal</CardTitle>
            <CardDescription>
              Kotak dialog terpusat dengan penahanan fokus keyboard dan
              penutupan dengan tombol Escape.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-xs text-muted">
              Ideal untuk formulir konfirmasi, sunting data profil, atau
              tinjauan detail.
            </p>
          </CardContent>
          <CardFooter>
            <Dialog bind:open={dialogOpen}>
              <DialogTrigger
                class="w-full inline-flex h-9 items-center justify-center rounded-xl bg-accent px-4 text-xs font-semibold text-accent-foreground shadow-sm hover:opacity-90"
              >
                Buka Dialog Modal
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Konfigurasi Lingkungan</DialogTitle>
                  <DialogDescription>
                    Atur preferensi aplikasi Anda langsung dari dialog modal
                    interaktif ini.
                  </DialogDescription>
                </DialogHeader>
                <div class="py-2 text-sm text-muted space-y-2">
                  <p>
                    Dialog ini menggunakan transisi halus dengan backdrop blur
                    serta palet warna Organic Clay yang ramah mata.
                  </p>
                </div>
                <DialogFooter>
                  <DialogClose
                    class="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-panel px-4 text-xs font-medium text-foreground hover:bg-canvas-subtle"
                  >
                    Tutup
                  </DialogClose>
                  <Button size="sm" onclick={() => (dialogOpen = false)}>
                    Terapkan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        <!-- Alert Dialog -->
        <Card class="bg-panel border-border flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Alert Dialog</CardTitle>
            <CardDescription>
              Peringatan tindakan destruktif yang memerlukan konfirmasi
              eksplisit dari pengguna.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-xs text-muted">
              Mencegah penghapusan atau rollback konfigurasi secara tidak
              sengaja.
            </p>
          </CardContent>
          <CardFooter>
            <AlertDialog bind:open={alertDialogOpen}>
              <AlertDialogTrigger
                class="w-full inline-flex h-9 items-center justify-center rounded-xl border border-destructive/40 bg-destructive/10 px-4 text-xs font-semibold text-destructive hover:bg-destructive/20"
              >
                Tindakan Berbahaya
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Pengaturan Proyek?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini akan mengembalikan seluruh variabel lingkungan
                    runtime ke setelan default pabrik. Tindakan ini tidak dapat
                    dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onclick={() => {
                      toast.success('Pengaturan telah di-reset.')
                      alertDialogOpen = false
                    }}
                  >
                    Ya, Reset Sekarang
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>

        <!-- Sheet Drawer -->
        <Card class="bg-panel border-border flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Sheet (Slide-Over Drawer)</CardTitle>
            <CardDescription>
              Panel samping yang meluncur masuk dari tepi layar untuk alur kerja
              mendalam.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-xs text-muted">
              Sangat cocok untuk navigasi mobile, filter katalog kompleks, atau
              formulir samping.
            </p>
          </CardContent>
          <CardFooter>
            <Sheet bind:open={sheetOpen}>
              <SheetTrigger
                class="w-full inline-flex h-9 items-center justify-center rounded-xl border border-border bg-panel px-4 text-xs font-medium text-foreground hover:bg-canvas-subtle"
              >
                Buka Sheet Samping
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Panel Samping Proyek</SheetTitle>
                  <SheetDescription>
                    Pratinjau komponen Sheet drawer yang meluncur mulus dari
                    sisi kanan layar.
                  </SheetDescription>
                </SheetHeader>
                <div class="py-6 space-y-4 text-sm text-foreground">
                  <div class="rounded-xl bg-canvas-subtle p-4 space-y-2">
                    <h5 class="text-xs font-semibold uppercase text-muted">
                      Status Engine
                    </h5>
                    <p class="text-xs">
                      Bun Workspaces aktif dengan 3 modul internal.
                    </p>
                  </div>
                  <div class="rounded-xl bg-canvas-subtle p-4 space-y-2">
                    <h5 class="text-xs font-semibold uppercase text-muted">
                      Keamanan Header
                    </h5>
                    <p class="text-xs">
                      X-Content-Type-Options: nosniff aktif.
                    </p>
                  </div>
                </div>
                <SheetFooter>
                  <SheetClose
                    class="w-full inline-flex h-9 items-center justify-center rounded-xl bg-accent text-xs font-semibold text-accent-foreground"
                  >
                    Selesai &amp; Tutup
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </CardFooter>
        </Card>

        <!-- Popover & Tooltip -->
        <Card class="bg-panel border-border flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Popover &amp; Tooltip</CardTitle>
            <CardDescription>
              Informasi mengambang kontekstual yang ramah sentuhan dan pembaca
              layar.
            </CardDescription>
          </CardHeader>
          <CardContent class="flex flex-wrap gap-3">
            <Popover>
              <PopoverTrigger
                class="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-panel px-3 text-xs font-medium text-foreground hover:bg-canvas-subtle"
              >
                Klik untuk Popover
              </PopoverTrigger>
              <PopoverContent class="w-72">
                <PopoverHeader>
                  <PopoverTitle>Informasi Singkat</PopoverTitle>
                  <PopoverDescription>
                    Popover mengambang di atas konten tanpa memblokir seluruh
                    interaksi layar.
                  </PopoverDescription>
                </PopoverHeader>
              </PopoverContent>
            </Popover>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  class="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-panel px-3 text-xs font-medium text-foreground hover:bg-canvas-subtle"
                >
                  Arahkan Kursor (Tooltip)
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ini adalah tooltip dengan penempatan cerdas.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
          <CardFooter>
            <span class="text-xs text-muted"
              >Mendukung keyboard navigation (Tab &amp; Esc)</span
            >
          </CardFooter>
        </Card>

        <!-- Sonner Toast Notifications -->
        <Card
          class="bg-panel border-border flex flex-col justify-between sm:col-span-2"
        >
          <CardHeader>
            <CardTitle>Notifikasi Toast (Sonner)</CardTitle>
            <CardDescription>
              Umpan balik non-intrusif yang muncul mengambang di sudut layar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-xs text-muted mb-3">
              Klik salah satu tombol untuk memicu notifikasi toast langsung di
              layar Anda:
            </p>
            <div class="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onclick={() =>
                  toast.success('Operasi Berhasil', {
                    description:
                      'Data pengguna telah disimpan dengan aman ke basis data.',
                  })}
              >
                Toast Sukses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onclick={() =>
                  toast.info('Info Sistem', {
                    description:
                      'Cache static asset Cloudflare telah diperbarui.',
                  })}
              >
                <BellIcon class="size-3.5 mr-1" aria-hidden="true" />
                <span>Toast Info</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onclick={() =>
                  toast.warning('Peringatan Kuota', {
                    description:
                      'Koneksi API mendekati batas rate limiting (90 req/menit).',
                  })}
              >
                Toast Peringatan
              </Button>
              <Button
                variant="outline"
                size="sm"
                onclick={() =>
                  toast.error('Permintaan Ditolak', {
                    description: 'Payload tidak memenuhi skema kontrak Zod.',
                  })}
              >
                Toast Kesalahan
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <span class="text-xs text-muted"
              >Ditenagai oleh pustaka svelte-sonner</span
            >
          </CardFooter>
        </Card>
      </div>
    </TabsContent>

    <!-- Tab 4: Data & Struktur (Card, Table, Avatar, Progress, Skeleton, Accordion, Breadcrumb) -->
    <TabsContent value="data" class="mt-6 space-y-6">
      <!-- Breadcrumb -->
      <div>
        <h4
          class="text-xs font-semibold tracking-wider text-muted uppercase mb-2"
        >
          Jejak Navigasi (Breadcrumb)
        </h4>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#sekilas">Honvelte Wind</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#features">Fitur</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Katalog Komponen</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Separator />

      <!-- Table & Avatars -->
      <div class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-3">
          <h4 class="text-xs font-semibold tracking-wider text-muted uppercase">
            Tabel Data Terstruktur (Table)
          </h4>
          <div class="overflow-x-auto rounded-xl border border-border bg-panel">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Komponen</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead class="text-right">Versi Runes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell class="font-medium">apps/web</TableCell>
                  <TableCell>Frontend SPA</TableCell>
                  <TableCell
                    ><Badge variant="green">Aktif 200 OK</Badge></TableCell
                  >
                  <TableCell class="text-right font-mono text-xs"
                    >Svelte 5.57</TableCell
                  >
                </TableRow>
                <TableRow>
                  <TableCell class="font-medium">apps/api</TableCell>
                  <TableCell>Backend Hono</TableCell>
                  <TableCell><Badge variant="yellow">Running</Badge></TableCell>
                  <TableCell class="text-right font-mono text-xs"
                    >Hono 4.7</TableCell
                  >
                </TableRow>
                <TableRow>
                  <TableCell class="font-medium">packages/contracts</TableCell>
                  <TableCell>Zod Contracts</TableCell>
                  <TableCell><Badge variant="orange">Shared</Badge></TableCell>
                  <TableCell class="text-right font-mono text-xs"
                    >Zod 3.24</TableCell
                  >
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <!-- Avatars & Progress -->
        <div class="space-y-4">
          <h4 class="text-xs font-semibold tracking-wider text-muted uppercase">
            Avatar &amp; Progress Bar
          </h4>
          <Card class="bg-panel border-border p-4 space-y-4">
            <div>
              <span class="text-xs text-muted block mb-2"
                >Avatar Kelompok (Avatar Group):</span
              >
              <AvatarGroup>
                <Avatar class="size-8">
                  <AvatarImage src="/favicon.webp" alt="Favicon Logo" />
                  <AvatarFallback class="bg-brand text-white font-bold text-xs"
                    >H</AvatarFallback
                  >
                </Avatar>
                <Avatar class="size-8">
                  <AvatarFallback
                    class="bg-accent text-accent-foreground font-bold text-xs"
                    >MK</AvatarFallback
                  >
                </Avatar>
                <Avatar class="size-8">
                  <AvatarFallback
                    class="bg-canvas-subtle text-foreground font-bold text-xs"
                    >AL</AvatarFallback
                  >
                </Avatar>
              </AvatarGroup>
            </div>

            <Separator />

            <div>
              <div
                class="flex justify-between text-xs text-foreground font-medium mb-1.5"
              >
                <span>Kelengkapan Starter</span>
                <span class="font-mono text-brand font-semibold">100%</span>
              </div>
              <Progress value={100} class="h-2" />
            </div>

            <Separator />

            <div>
              <span class="text-xs text-muted block mb-2"
                >Kerangka Pemuatan (Skeleton):</span
              >
              <div class="space-y-2">
                <Skeleton class="h-3 w-4/5 rounded" />
                <Skeleton class="h-3 w-3/5 rounded" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Separator />

      <!-- Accordion FAQ -->
      <div>
        <h4
          class="text-xs font-semibold tracking-wider text-muted uppercase mb-3"
        >
          Daftar Lipat / FAQ (Accordion)
        </h4>
        <Accordion
          type="single"
          class="w-full rounded-xl border border-border bg-panel px-4"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger class="text-sm font-semibold text-foreground">
              Di mana komponen-komponen ini disimpan?
            </AccordionTrigger>
            <AccordionContent class="text-xs text-muted leading-relaxed">
              Semua komponen bersumber langsung di <code
                >apps/web/src/lib/components/ui/</code
              >
              dan diekspor melalui <code>$lib/components/ui</code>. Anda dapat
              menyunting atau memperluas kodenya tanpa dependensi bundel
              eksternal tersembunyi.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger class="text-sm font-semibold text-foreground">
              Apakah seluruh komponen kompatibel dengan Svelte 5 runes?
            </AccordionTrigger>
            <AccordionContent class="text-xs text-muted leading-relaxed">
              Ya, seluruh komponen dibangun secara native menggunakan <code
                >$props()</code
              >, <code>$state()</code>, <code>$derived()</code>, dan
              <code>$bindable()</code> untuk reaktivitas presisi tanpa runtime store
              Svelte 4 lama.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger class="text-sm font-semibold text-foreground">
              Bagaimana cara mengimpor komponen ke halaman fitur saya?
            </AccordionTrigger>
            <AccordionContent class="text-xs text-muted leading-relaxed">
              Gunakan impor direktori atau modul bersama: <code
                >import &#123; Button &#125; from '$lib/components/ui/button'</code
              >
              atau
              <code
                >import &#123; Badge, Card &#125; from '$lib/components/ui'</code
              >.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </TabsContent>

    <!-- Tab 5: AI & Panduan Akses (Interactive AI chat widgets, CodeBlock & Tips) -->
    <TabsContent value="interactive" class="mt-6 space-y-6">
      <div class="grid gap-6 md:grid-cols-2">
        <Card class="bg-panel border-border">
          <CardHeader>
            <CardTitle>Struktur Kode Impor</CardTitle>
            <CardDescription>
              Contoh cuplikan penggunaan komponen di fitur baru Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              class="rounded-xl border border-border bg-canvas-subtle p-4 font-mono text-xs leading-relaxed text-foreground overflow-x-auto"
            >
              <p class="text-muted">
                // 1. Impor komponen dari $lib/components/ui
              </p>
              <p class="text-brand font-medium">
                import &#123; Button, Badge, Card, Dialog &#125; from
                '$lib/components/ui'
              </p>
              <br />
              <p class="text-muted">// 2. Gunakan di template Svelte 5</p>
              <p>&lt;Card&gt;</p>
              <p class="pl-4">
                &lt;Badge variant="green"&gt;200 OK&lt;/Badge&gt;
              </p>
              <p class="pl-4">
                &lt;Button variant="brand"&gt;Mulai Proyek&lt;/Button&gt;
              </p>
              <p>&lt;/Card&gt;</p>
            </div>
          </CardContent>
          <CardFooter class="justify-between">
            <span class="text-xs text-muted">Zero build overhead</span>
            <Button
              size="sm"
              variant="outline"
              onclick={() =>
                toast.info(
                  'Kode dapat disalin langsung dari berkas fitur Anda',
                )}>Salin Contoh</Button
            >
          </CardFooter>
        </Card>

        <Card class="bg-panel border-border">
          <CardHeader>
            <CardTitle>Standar Aksesibilitas Terintegrasi</CardTitle>
            <CardDescription>
              Setiap komponen dirancang ramah navigasi keyboard dan kontras
              tinggi.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3 text-xs text-muted">
            <div class="flex items-start gap-2.5">
              <span
                class="inline-flex size-5 items-center justify-center rounded-full bg-green-bg text-green-ink font-bold text-[10px] shrink-0 mt-0.5"
                >✓</span
              >
              <p>
                <strong class="text-foreground">Fokus Tampak Jelas:</strong> Indikator
                fokus 2px dengan offset kontras tinggi pada setiap elemen interaktif.
              </p>
            </div>
            <div class="flex items-start gap-2.5">
              <span
                class="inline-flex size-5 items-center justify-center rounded-full bg-green-bg text-green-ink font-bold text-[10px] shrink-0 mt-0.5"
                >✓</span
              >
              <p>
                <strong class="text-foreground">WAI-ARIA Lengkap:</strong> Dialog
                modal mengunci fokus di dalam modal, mendukung tombol Escape, dan
                mengembalikan fokus saat ditutup.
              </p>
            </div>
            <div class="flex items-start gap-2.5">
              <span
                class="inline-flex size-5 items-center justify-center rounded-full bg-green-bg text-green-ink font-bold text-[10px] shrink-0 mt-0.5"
                >✓</span
              >
              <p>
                <strong class="text-foreground">Kontras Rasio WCAG AA:</strong> Warna
                latar dan teks telah diverifikasi otomatis melalui Axe-core Playwright.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Badge variant="green" class="w-full justify-center py-1"
              >16/16 Playwright E2E Tests Lolos</Badge
            >
          </CardFooter>
        </Card>
      </div>
    </TabsContent>
  </Tabs>
</div>
